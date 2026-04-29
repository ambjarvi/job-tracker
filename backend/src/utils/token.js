import jwt from 'jsonwebtoken'

export const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
