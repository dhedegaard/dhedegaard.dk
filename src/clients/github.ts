import type { UserQueryQuery } from '../codegen/types'
import { userQuery } from './user-query'

export type GithubUser = NonNullable<UserQueryQuery['user']>

export const getGithubUser = async (): Promise<GithubUser> => {
  const pat: unknown = process.env['GITHUB_PAT']
  if (typeof pat !== 'string' || pat === '') {
    throw new Error('GITHUB_PAT is not set')
  }
  const query = userQuery.loc?.source.body
  if (query == null) {
    throw new Error('Failed to read user query')
  }
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${pat}`,
    },
    next: {
      revalidate: 3600,
    },
  })
  if (!response.ok) {
    throw new Error(`${response.status.toString()}: ${response.statusText}`)
  }
  const responseJson = await (response.json() as Promise<{
    errors?: unknown
    data: UserQueryQuery
  }>)

  if (responseJson.errors != null) {
    throw new Error(`Error in Github response: ${JSON.stringify(responseJson.errors)}`, {
      cause: responseJson.errors,
    })
  }
  const user = responseJson.data.user
  if (user == null) {
    throw new Error('Github user was not found')
  }

  return user
}
