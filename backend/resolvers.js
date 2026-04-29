import { GraphQLError } from 'graphql'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs'
import { v2 as cloudinary } from 'cloudinary'
import { Resume } from './src/models/Resume.js'
import { Application } from './src/models/Application.js'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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
      const buffer = await streamToBuffer(createReadStream())

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'raw', folder: 'resumes' },
          (err, res) => (err ? reject(err) : resolve(res))
        ).end(buffer)
      })

      const resume = new Resume({ name, filePath: result.secure_url, fileType })
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

      let fileBuffer
      try {
        const res = await fetch(resume.filePath)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        fileBuffer = Buffer.from(await res.arrayBuffer())
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
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `You are a resume editor. Tailor the resume below for the job posting provided. You must respond with ONLY a valid JSON object and no other text, markdown, or explanation.

Rules:
- Do not invent, fabricate, or imply any skill, tool, technology, or experience that is not already present in the resume
- Only reword, reorder, and re-emphasize what already exists

Return exactly this JSON structure:
{
  "tailoredResume": "the full rewritten resume text",
  "changes": "bullet list of what was reworded or re-emphasized",
  "suggestions": "bullet list of skills or experience the job mentions that are NOT in the resume, framed as: if you have experience with X, consider adding it"
}

Job: ${application.role} at ${application.company}
${application.description ? `Job Description:\n${application.description}\n` : ''}
Resume:
${resumeText}`,
          },
        ],
      })

      const raw = message.content[0].type === 'text' ? message.content[0].text : ''
      let parsed
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      } catch {
        throw new GraphQLError(`Failed to parse AI response as JSON. Raw response: ${raw}`, {
          extensions: { code: 'AI_PARSE_ERROR' },
        })
      }
      return {
        resumeId,
        applicationId,
        tailoredResume: parsed.tailoredResume,
        changes: parsed.changes,
        suggestions: parsed.suggestions,
      }
    },
  },
}
