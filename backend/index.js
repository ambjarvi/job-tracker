import 'dotenv/config'
import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'
import { typeDefs } from './schema.js'
import { resolvers } from './resolvers.js'
import { User } from './src/models/User.js'
import { signToken } from './src/utils/token.js'

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
  process.exit(1)
})

try {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')
} catch (err) {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
}

const app = express()
const server = new ApolloServer({ typeDefs, resolvers })
await server.start()

const allowedOrigins = ['http://localhost:5174']
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL)

app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id })
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
        })
      }
      done(null, user)
    } catch (err) {
      done(err)
    }
  }
))

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const token = signToken(req.user._id)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  }
)

app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 1 }))
app.use('/', express.json(), expressMiddleware(server, {
  context: async ({ req }) => {
    const auth = req.headers.authorization || ''
    if (!auth.startsWith('Bearer ')) return { user: null }
    const token = auth.slice(7)
    try {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(userId).lean()
      return { user: user || null }
    } catch {
      return { user: null }
    }
  },
}))

const port = process.env.PORT ?? 4000
app.listen(port, () => console.log(`GraphQL server ready at http://localhost:${port}/`))
