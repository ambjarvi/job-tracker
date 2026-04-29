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

const app = express()
const server = new ApolloServer({ typeDefs, resolvers })
await server.start()

app.use(cors())
app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 1 }))
app.use('/', express.json(), expressMiddleware(server))

app.listen(4000, () => console.log('GraphQL server ready at http://localhost:4000/'))
