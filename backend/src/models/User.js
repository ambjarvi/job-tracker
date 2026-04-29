import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false })

export const User = mongoose.model('User', userSchema)
