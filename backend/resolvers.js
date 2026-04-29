import { randomUUID } from 'crypto'
import { GraphQLError } from 'graphql'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { Resume } from './src/models/Resume.js'
import { Application } from './src/models/Application.js'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const bucket = process.env.S3_BUCKET_NAME

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

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
    applications: async (_, { status }) => {
      const filter = status ? { status } : {}
      return Application.find(filter)
    },

    application: async (_, { id }) => Application.findById(id),

    resumes: async () => Resume.find(),

    resume: async (_, { id }) => Resume.findById(id),
  },

  Application: {
    resume: async (app) => {
      if (!app.resumeId) return null
      return Resume.findById(app.resumeId)
    },
  },

  Resume: {
    applications: async (resume) => Application.find({ resumeId: resume._id }),
  },

  Mutation: {
    addApplication: async (_, { company, role, url = null, description = null, status, resumeId = null }) => {
      if (resumeId) {
        const exists = await Resume.findById(resumeId)
        if (!exists) {
          throw new GraphQLError(`Resume with id "${resumeId}" not found`, {
            extensions: { code: 'NOT_FOUND' },
          })
        }
      }
      const app = new Application({
        company,
        role,
        url,
        description,
        status,
        appliedAt: status !== 'WISHLIST' ? new Date().toISOString() : null,
        resumeId: resumeId || null,
      })
      return app.save()
    },

    updateStatus: async (_, { id, status }) => {
      const app = await Application.findById(id)
      if (!app) return null
      app.status = status
      if (status !== 'WISHLIST' && !app.appliedAt) {
        app.appliedAt = new Date().toISOString()
      }
      return app.save()
    },

    deleteApplication: async (_, { id }) => {
      const result = await Application.findByIdAndDelete(id)
      return result !== null
    },

    uploadResume: async (_, { name, filePath, fileType }) => {
      const resume = new Resume({ name, filePath, fileType })
      return resume.save()
    },

    uploadResumeFile: async (_, { name, file, fileType }) => {
      const { createReadStream } = await file

      const ext = fileType === 'DOCX' ? '.docx' : '.pdf'
      const key = `resumes/${randomUUID()}${ext}`
      const contentType = fileType === 'DOCX'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf'

      const buffer = await streamToBuffer(createReadStream())

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }))

      const filePath = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
      const resume = new Resume({ name, filePath, fileType })
      return resume.save()
    },

    deleteResume: async (_, { id }) => {
      const inUse = await Application.exists({ resumeId: id })
      if (inUse) {
        throw new GraphQLError('Cannot delete resume: it is referenced by one or more applications', {
          extensions: { code: 'CONSTRAINT_VIOLATION' },
        })
      }
      const result = await Resume.findByIdAndDelete(id)
      return result !== null
    },

    tailorResume: async (_, { resumeId, applicationId }) => {
      const resume = await Resume.findById(resumeId)
      if (!resume) {
        throw new GraphQLError(`Resume with id "${resumeId}" not found`, {
          extensions: { code: 'NOT_FOUND' },
        })
      }
      const application = await Application.findById(applicationId)
      if (!application) {
        throw new GraphQLError(`Application with id "${applicationId}" not found`, {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      const s3Key = new URL(resume.filePath).pathname.slice(1)
      let fileBuffer
      try {
        const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: s3Key }))
        fileBuffer = await streamToBuffer(Body)
      } catch {
        throw new GraphQLError(`Could not read resume file at "${resume.filePath}"`, {
          extensions: { code: 'FILE_READ_ERROR' },
        })
      }

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
