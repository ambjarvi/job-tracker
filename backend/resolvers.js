import { randomUUID } from 'crypto'
import { readFile, mkdir } from 'fs/promises'
import { createWriteStream } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { GraphQLError } from 'graphql'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs'
import { resumes, applications } from './data.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function extractPdfText(buffer) {
  const uint8 = new Uint8Array(buffer)
  const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise
  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) =>
      pdf.getPage(i + 1).then((p) => p.getTextContent()).then((tc) =>
        tc.items.map((it) => it.str).join(' ')
      )
    )
  )
  return pages.join('\n')
}

export const resolvers = {
  Upload: GraphQLUpload,

  Query: {
    applications: (_, { status }) =>
      status ? applications.filter((a) => a.status === status) : [...applications],

    application: (_, { id }) => applications.find((a) => a.id === id) ?? null,

    resumes: () => [...resumes],

    resume: (_, { id }) => resumes.find((r) => r.id === id) ?? null,
  },

  Application: {
    resume: (app) => resumes.find((r) => r.id === app.resumeId) ?? null,
  },

  Resume: {
    applications: (resume) => applications.filter((a) => a.resumeId === resume.id),
  },

  Mutation: {
    addApplication: (_, { company, role, url = null, description = null, status, resumeId = null }) => {
      if (resumeId && !resumes.find((r) => r.id === resumeId)) {
        throw new GraphQLError(`Resume with id "${resumeId}" not found`, {
          extensions: { code: 'NOT_FOUND' },
        })
      }
      const app = {
        id: randomUUID(),
        company,
        role,
        url,
        description,
        status,
        appliedAt: status !== 'WISHLIST' ? new Date().toISOString() : null,
        resumeId,
      }
      applications.push(app)
      return app
    },

    updateStatus: (_, { id, status }) => {
      const app = applications.find((a) => a.id === id)
      if (!app) return null
      app.status = status
      if (status !== 'WISHLIST' && !app.appliedAt) {
        app.appliedAt = new Date().toISOString()
      }
      return app
    },

    deleteApplication: (_, { id }) => {
      const idx = applications.findIndex((a) => a.id === id)
      if (idx === -1) return false
      applications.splice(idx, 1)
      return true
    },

    uploadResume: (_, { name, filePath, fileType }) => {
      const resume = {
        id: randomUUID(),
        name,
        filePath,
        fileType,
        uploadedAt: new Date().toISOString(),
      }
      resumes.push(resume)
      return resume
    },

    uploadResumeFile: async (_, { name, file, fileType }) => {
      const { createReadStream, filename } = await file

      const uploadsDir = resolve(__dirname, 'uploads')
      await mkdir(uploadsDir, { recursive: true })

      const ext = fileType === 'DOCX' ? '.docx' : '.pdf'
      const savedName = `${randomUUID()}${ext}`
      const filePath = `/uploads/${savedName}`
      const fullPath = resolve(uploadsDir, savedName)

      await new Promise((res, rej) => {
        const ws = createWriteStream(fullPath)
        createReadStream().pipe(ws)
        ws.on('finish', res)
        ws.on('error', rej)
      })

      const resume = {
        id: randomUUID(),
        name,
        filePath,
        fileType,
        uploadedAt: new Date().toISOString(),
      }
      resumes.push(resume)
      return resume
    },

    deleteResume: (_, { id }) => {
      if (applications.some((a) => a.resumeId === id)) {
        throw new GraphQLError('Cannot delete resume: it is referenced by one or more applications', {
          extensions: { code: 'CONSTRAINT_VIOLATION' },
        })
      }
      const idx = resumes.findIndex((r) => r.id === id)
      if (idx === -1) return false
      resumes.splice(idx, 1)
      return true
    },

    tailorResume: async (_, { resumeId, applicationId }) => {
      const resume = resumes.find((r) => r.id === resumeId)
      if (!resume) {
        throw new GraphQLError(`Resume with id "${resumeId}" not found`, {
          extensions: { code: 'NOT_FOUND' },
        })
      }
      const application = applications.find((a) => a.id === applicationId)
      if (!application) {
        throw new GraphQLError(`Application with id "${applicationId}" not found`, {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      const fileBuffer = await readFile(resolve(__dirname, '.' + resume.filePath)).catch(() => {
        throw new GraphQLError(`Could not read resume file at "${resume.filePath}"`, {
          extensions: { code: 'FILE_READ_ERROR' },
        })
      })

      let resumeText
      if (resume.fileType === 'DOCX') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        resumeText = result.value
      } else {
        resumeText = await extractPdfText(fileBuffer)
      }

      const client = new Anthropic()
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a career coach helping tailor a resume for a specific job application.

Job: ${application.role} at ${application.company}
${application.description ? `Job Description:\n${application.description}\n` : ''}
Resume Content:
${resumeText}

Provide specific, actionable suggestions to tailor this resume for the job. Focus on keywords to add, skills to highlight, and experience to reframe.`,
          },
        ],
      })

      const suggestions = message.content[0].type === 'text' ? message.content[0].text : ''
      return { resumeId, applicationId, suggestions }
    },
  },
}
