import * as z from 'zod/mini'
import type { UserQueryQuery } from '../codegen/types'
import { userQuery } from './user-query'

const languageSchema = z.object({
  id: z.string(),
  color: z.nullable(z.string()),
  name: z.string(),
})

const topicNodeSchema = z.object({
  id: z.string(),
  topic: z.object({ id: z.string(), name: z.string() }),
})

const repositoryNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  pushedAt: z.nullable(z.string()),
  description: z.nullable(z.string()),
  isArchived: z.boolean(),
  stargazerCount: z.number(),
  isPrivate: z.boolean(),
  homepageUrl: z.nullable(z.string()),
  owner: z.object({ id: z.string() }),
  repositoryTopics: z.object({
    edges: z.nullable(
      z.array(z.nullable(z.object({ node: z.nullable(topicNodeSchema) })))
    ),
  }),
  primaryLanguage: z.nullable(languageSchema),
  languages: z.nullable(
    z.object({
      edges: z.nullable(z.array(z.nullable(z.object({ node: languageSchema })))),
    })
  ),
})

const pinnedItemSchema = z.union([
  z.object({ __typename: z.literal('Gist') }),
  z.object({ __typename: z.literal('Repository'), id: z.string(), name: z.string() }),
])

export const githubUserSchema = z.object({
  id: z.string(),
  avatarUrl: z.string(),
  url: z.string(),
  email: z.string(),
  pinnedItems: z.object({
    nodes: z.nullable(z.array(z.nullable(pinnedItemSchema))),
  }),
  repositories: z.object({
    edges: z.nullable(
      z.array(
        z.nullable(
          z.object({
            node: z.nullable(repositoryNodeSchema),
          })
        )
      )
    ),
  }),
}) satisfies z.ZodMiniType<NonNullable<UserQueryQuery['user']>>

export type GithubUser = z.infer<typeof githubUserSchema>

export const getGithubUser = async (): Promise<GithubUser> => {
  const pat: unknown = process.env['GITHUB_PAT']
  if (typeof pat !== 'string' || pat === '') {
    throw new Error('GITHUB_PAT is not set')
  }
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    body: JSON.stringify({ query: userQuery }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${pat}`,
    },
  })
  if (!response.ok) {
    throw new Error(`${response.status.toString()}: ${response.statusText}`)
  }
  const responseJson = await (response.json() as Promise<{
    errors?: unknown
    data: { user: unknown }
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

  return githubUserSchema.parse(user, { reportInput: true })
}
