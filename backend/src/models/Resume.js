import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, enum: ['PDF', 'DOCX'], required: true },
    uploadedAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
)

export const Resume = mongoose.model('Resume', resumeSchema)
