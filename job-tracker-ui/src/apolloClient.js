import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core'

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000' }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
})

export default client
