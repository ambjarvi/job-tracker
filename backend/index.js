import 'dotenv/config'
import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'
import { typeDefs } from './schema.js'
import { resolvers } from './resolvers.js'

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

app.use(cors({ origin: allowedOrigins }))
app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 1 }))
app.use('/', express.json(), expressMiddleware(server))

const port = process.env.PORT ?? 4000
app.listen(port, () => console.log(`GraphQL server ready at http://localhost:${port}/`))
