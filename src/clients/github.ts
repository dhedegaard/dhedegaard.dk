import type { Language, RepositoryTopic, User } from '../codegen/types'
import { userQuery } from './user-query'

export interface GithubRepository {
  id: string
  name: string
  url: string
  pinned: boolean
  description: string | null
  updatedAt: string | null
  pushedAt: string | null
  homepageUrl: null | string
  languages: Language[]
  stargazerCount: number
  topics: RepositoryTopic[]
}

export const getGithubUser = async (): Promise<User> => {
  const pat: unknown = process.env['GITHUB_PAT']
  if (typeof pat !== 'string' || pat === '') {
    throw new Error('GITHUB_PAT is not set')
  }
  const query = userQuery.loc?.source.body
  if (query == null) {
    throw new Error('Failed to read user query')
  }
  return await fetch('https://api.github.com/graphql', {
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
    .then((response) => {
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`)
      }
      return response.json() as Promise<{ errors?: unknown; data: { user: User } }>
    })
    .then((response) => {
      if (response.errors != null) {
        throw new Error(`Error in Github response: ${JSON.stringify(response.errors)}`, {
          cause: response.errors,
        })
      }
      return response.data.user
    })
}
