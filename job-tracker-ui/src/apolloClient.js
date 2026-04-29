import { ApolloClient, InMemoryCache, ApolloLink, Observable, HttpLink } from '@apollo/client/core'
import { print } from 'graphql'

const URI = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/'

// Intercepts mutations that contain File variables and sends them as
// multipart/form-data per the graphql-multipart-request-spec.
const uploadLink = new ApolloLink((operation, forward) => {
  const { variables } = operation
  const fileEntries = Object.entries(variables).filter(([, v]) => typeof File !== 'undefined' && v instanceof File)

  if (fileEntries.length === 0) {
    return forward(operation)
  }

  const nulledVars = { ...variables }
  const map = {}
  fileEntries.forEach(([key], i) => {
    nulledVars[key] = null
    map[String(i)] = [`variables.${key}`]
  })

  const form = new FormData()
  form.append('operations', JSON.stringify({
    query: print(operation.query),
    variables: nulledVars,
    operationName: operation.operationName,
  }))
  form.append('map', JSON.stringify(map))
  fileEntries.forEach(([, file], i) => {
    form.append(String(i), file, file.name)
  })

  return new Observable((observer) => {
    fetch(URI, { method: 'POST', body: form, headers: { 'apollo-require-preflight': 'true' } })
      .then((res) => res.json())
      .then((result) => { observer.next(result); observer.complete() })
      .catch((err) => observer.error(err))
  })
})

const client = new ApolloClient({
  link: ApolloLink.from([uploadLink, new HttpLink({ uri: URI })]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
})

export default client
