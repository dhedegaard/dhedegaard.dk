import { print } from 'graphql'
import * as z from 'zod/mini'
import { contributionsQuery } from './contributions-query'
import type { ResultOf } from './graphql'
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
  isFork: z.boolean(),
  stargazerCount: z.number(),
  isPrivate: z.boolean(),
  homepageUrl: z.nullable(z.string()),
  owner: z.object({ id: z.string() }),
  repositoryTopics: z.object({
    edges: z.nullable(z.array(z.nullable(z.object({ node: z.nullable(topicNodeSchema) })))),
  }),
  primaryLanguage: z.nullable(languageSchema),
  languages: z.nullable(
    z.object({
      edges: z.nullable(z.array(z.nullable(z.object({ size: z.number(), node: languageSchema })))),
    })
  ),
})

const pinnedItemSchema = z.union([
  z.object({ __typename: z.literal('Gist') }),
  z.object({ __typename: z.literal('Repository'), id: z.string(), name: z.string() }),
])

const githubUserSchema = z.object({
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
}) satisfies z.ZodMiniType<NonNullable<ResultOf<typeof userQuery>['user']>>

export type GithubUser = z.infer<typeof githubUserSchema>

const githubContributionsSchema = z.object({
  contributionsCollection: z.object({
    contributionCalendar: z.object({
      weeks: z.array(
        z.object({
          contributionDays: z.array(
            z.object({ date: z.iso.date(), contributionCount: z.int().check(z.nonnegative()) })
          ),
        })
      ),
    }),
  }),
}) satisfies z.ZodMiniType<NonNullable<ResultOf<typeof contributionsQuery>['user']>>

export type GithubContributions = z.infer<typeof githubContributionsSchema>

// The query documents are static, so serialize them once at module load.
const userQueryString = print(userQuery)
const contributionsQueryString = print(contributionsQuery)

const REQUEST_TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 1000
// Transient failures, including secondary rate limits (403/429).
const isRetryableStatus = (status: number): boolean =>
  status >= 500 || status === 403 || status === 429

const postGithubQuery = async (
  query: string,
  variables?: Record<string, string>
): Promise<Record<string, unknown>> => {
  const pat: unknown = process.env['GITHUB_PAT']
  if (typeof pat !== 'string' || pat === '') {
    throw new Error('GITHUB_PAT is not set')
  }
  const send = () =>
    fetch('https://api.github.com/graphql', {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${pat}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  // A network error or timeout counts as retryable, like a transient status.
  const first = await send().catch(() => null)
  if (first != null && !isRetryableStatus(first.status)) {
    return readGithubData(first)
  }
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
  return readGithubData(await send())
}

const readGithubData = async (response: Response): Promise<Record<string, unknown>> => {
  if (!response.ok) {
    throw new Error(`${response.status.toString()}: ${response.statusText}`)
  }
  const responseJson = await (response.json() as Promise<{
    errors?: unknown
    data?: Record<string, unknown> | null
  }>)

  if (responseJson.errors != null) {
    throw new Error(`Error in Github response: ${JSON.stringify(responseJson.errors)}`, {
      cause: responseJson.errors,
    })
  }
  if (responseJson.data == null) {
    throw new Error('Malformed Github response: missing "data"')
  }
  return responseJson.data
}

export const getGithubUser = async (): Promise<GithubUser> => {
  const user = (await postGithubQuery(userQueryString))['user']
  if (user == null) {
    throw new Error('Github user was not found')
  }

  return githubUserSchema.parse(user, { reportInput: true })
}

export const getGithubContributions = async (login: string): Promise<GithubContributions> => {
  const user = (await postGithubQuery(contributionsQueryString, { login }))['user']
  if (user == null) {
    throw new Error(`Github user ${login} was not found`)
  }

  return githubContributionsSchema.parse(user, { reportInput: true })
}
