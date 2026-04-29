import { GraphQLError } from 'graphql'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import bcrypt from 'bcryptjs'
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs'
import { v2 as cloudinary } from 'cloudinary'
import { Resume } from './src/models/Resume.js'
import { Application } from './src/models/Application.js'
import { User } from './src/models/User.js'
import { signToken } from './src/utils/token.js'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function requireAuth(user) {
  if (!user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
}

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
    me: (_, __, { user }) => user ?? null,

    applications: async (_, { status }, { user }) => {
      requireAuth(user)
      const filter = { userId: user._id }
      if (status) filter.status = status
      return Application.find(filter)
    },

    application: async (_, { id }, { user }) => {
      requireAuth(user)
      return Application.findOne({ _id: id, userId: user._id })
    },

    resumes: async (_, __, { user }) => {
      requireAuth(user)
      return Resume.find({ userId: user._id })
    },

    resume: async (_, { id }, { user }) => {
      requireAuth(user)
      return Resume.findOne({ _id: id, userId: user._id })
    },
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
    register: async (_, { email, name, password }) => {
      const existing = await User.findOne({ email })
      if (existing) {
        throw new GraphQLError('Email already in use', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }
      const passwordHash = await bcrypt.hash(password, 10)
      const user = await User.create({ email, name, passwordHash })
      return { token: signToken(user._id), user }
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email })
      if (!user || !user.passwordHash) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }
      return { token: signToken(user._id), user }
    },

    addApplication: async (_, { company, role, url = null, description = null, status, resumeId = null }, { user }) => {
      requireAuth(user)
      if (resumeId) {
        const exists = await Resume.findOne({ _id: resumeId, userId: user._id })
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
        userId: user._id,
      })
      return app.save()
    },

    updateStatus: async (_, { id, status }, { user }) => {
      requireAuth(user)
      const app = await Application.findOne({ _id: id, userId: user._id })
      if (!app) return null
      app.status = status
      if (status !== 'WISHLIST' && !app.appliedAt) {
        app.appliedAt = new Date().toISOString()
      }
      return app.save()
    },

    updateApplication: async (_, { id, company, role, url, description, status, resumeId }, { user }) => {
      requireAuth(user)
      const app = await Application.findOne({ _id: id, userId: user._id })
      if (!app) return null
      if (company !== undefined) app.company = company
      if (role !== undefined) app.role = role
      if (url !== undefined) app.url = url ?? null
      if (description !== undefined) app.description = description ?? null
      if (resumeId !== undefined) {
        if (resumeId) {
          const exists = await Resume.findOne({ _id: resumeId, userId: user._id })
          if (!exists) {
            throw new GraphQLError(`Resume with id "${resumeId}" not found`, {
              extensions: { code: 'NOT_FOUND' },
            })
          }
        }
        app.resumeId = resumeId || null
      }
      if (status !== undefined) {
        app.status = status
        if (status !== 'WISHLIST' && !app.appliedAt) {
          app.appliedAt = new Date().toISOString()
        }
      }
      return app.save()
    },

    deleteApplication: async (_, { id }, { user }) => {
      requireAuth(user)
      const result = await Application.findOneAndDelete({ _id: id, userId: user._id })
      return result !== null
    },

    uploadResume: async (_, { name, filePath, fileType }, { user }) => {
      requireAuth(user)
      const resume = new Resume({ name, filePath, fileType, userId: user._id })
      return resume.save()
    },

    uploadResumeFile: async (_, { name, file, fileType }, { user }) => {
      requireAuth(user)
      const { createReadStream } = await file
      const buffer = await streamToBuffer(createReadStream())

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'raw', folder: 'resumes' },
          (err, res) => (err ? reject(err) : resolve(res))
        ).end(buffer)
      })

      const resume = new Resume({ name, filePath: result.secure_url, fileType, userId: user._id })
      return resume.save()
    },

    deleteResume: async (_, { id }, { user }) => {
      requireAuth(user)
      const resume = await Resume.findOne({ _id: id, userId: user._id })
      if (!resume) return false
      const inUse = await Application.exists({ resumeId: id, userId: user._id })
      if (inUse) {
        throw new GraphQLError('Cannot delete resume: it is referenced by one or more applications', {
          extensions: { code: 'CONSTRAINT_VIOLATION' },
        })
      }
      await resume.deleteOne()
      return true
    },

    tailorResume: async (_, { resumeId, applicationId }, { user }) => {
      requireAuth(user)
      const resume = await Resume.findOne({ _id: resumeId, userId: user._id })
      if (!resume) {
        throw new GraphQLError(`Resume with id "${resumeId}" not found`, {
          extensions: { code: 'NOT_FOUND' },
        })
      }
      const application = await Application.findOne({ _id: applicationId, userId: user._id })
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
