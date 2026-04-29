import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    url: { type: String, default: null },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED'],
      required: true,
    },
    appliedAt: { type: String, default: null },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
  },
  { versionKey: false }
)

export const Application = mongoose.model('Application', applicationSchema)
