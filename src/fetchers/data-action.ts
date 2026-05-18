import { captureException } from '@sentry/nextjs'
import uniqBy from 'lodash-es/uniqBy'
import * as z from 'zod/mini'
import { getGithubUser } from '../clients/github'

const DataRepositorLanguage = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  color: z.nullable(z.string().check(z.minLength(1))),
})
export interface DataRepositoryLanguage extends z.infer<typeof DataRepositorLanguage> {}

const DataRepositoryTopic = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
})
export interface DataRepositoryTopic extends z.infer<typeof DataRepositoryTopic> {}

const DataRepository = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  url: z.url(),
  pinned: z.boolean(),
  description: z.nullable(z.string().check(z.minLength(1))),
  homepageUrl: z.nullable(z.url()),
  pushedAt: z.nullable(z.iso.datetime({ offset: true })),
  stargazerCount: z.int().check(z.nonnegative()),
  languages: z.array(
    DataRepositorLanguage as z.ZodMiniType<DataRepositoryLanguage, DataRepositoryLanguage>
  ),
  topics: z.array(DataRepositoryTopic as z.ZodMiniType<DataRepositoryTopic, DataRepositoryTopic>),
})
export interface DataRepository extends z.infer<typeof DataRepository> {}

const DataResult = z.object({
  avatarUrl: z.url(),
  githubUrl: z.url(),
  email: z.nullable(z.email()),
  repositories: z.array(DataRepository as z.ZodMiniType<DataRepository, DataRepository>),
})
export interface DataResult extends z.infer<typeof DataResult> {}

type GithubUserData = Awaited<ReturnType<typeof getGithubUser>>
type GithubRepoEdge = GithubUserData['repositories']['edges'] extends
  | readonly (infer Edge)[]
  | null
  | undefined
  ? Edge
  : never
type GithubRepoNode = NonNullable<NonNullable<GithubRepoEdge>['node']>

const getOrderedPinnedNodeIds = (user: GithubUserData): string[] =>
  user.pinnedItems.nodes?.flatMap((node) => (node?.__typename === 'Repository' ? [node.id] : [])) ??
  []

const buildPinnedRankMap = (
  orderedPinnedNodeIds: readonly string[]
): ReadonlyMap<string, number> => {
  const pinnedRankMap = new Map<string, number>()
  for (const [index, repositoryId] of orderedPinnedNodeIds.entries()) {
    pinnedRankMap.set(repositoryId, index)
  }
  return pinnedRankMap
}

const extractLanguages = (repo: GithubRepoNode): DataRepositoryLanguage[] =>
  uniqBy(
    [repo.primaryLanguage, ...(repo.languages?.edges?.map((edge) => edge?.node) ?? [])].filter(
      (language): language is NonNullable<typeof language> => language != null
    ),
    (language) => language.id
  ).map((language) => ({
    id: language.id,
    name: language.name,
    color: language.color ?? null,
  }))

const extractTopics = (repo: GithubRepoNode): DataRepositoryTopic[] =>
  repo.repositoryTopics.edges
    ?.map((topic) => topic?.node ?? undefined)
    .filter((topic): topic is NonNullable<typeof topic> => topic != null)
    .map((topic) => ({
      id: topic.topic.id,
      name: topic.topic.name,
    })) ?? []

const getPinnedRank = (repositoryId: string, pinnedRankMap: ReadonlyMap<string, number>): number =>
  pinnedRankMap.get(repositoryId) ?? Infinity

const toDataRepository = (
  repo: GithubRepoNode,
  userId: string,
  pinnedRankMap: ReadonlyMap<string, number>
): DataRepository | null => {
  if (repo.isPrivate || repo.isArchived || repo.owner.id !== userId) {
    return null
  }

  return DataRepository.parse({
    id: repo.id,
    name: repo.name,
    url: ensureString(repo.url, 'repository url'),
    pinned: getPinnedRank(repo.id, pinnedRankMap) !== Infinity,
    description: ensureNonEmptyNullableString(repo.description),
    homepageUrl: ensureHomepageUrl(repo.homepageUrl),
    pushedAt: ensureNullableString(repo.pushedAt),
    stargazerCount: repo.stargazerCount,
    languages: extractLanguages(repo),
    topics: extractTopics(repo),
  })
}

const compareRepositories = (
  left: DataRepository,
  right: DataRepository,
  pinnedRankMap: ReadonlyMap<string, number>
): number => {
  const leftPinnedRank = getPinnedRank(left.id, pinnedRankMap)
  const rightPinnedRank = getPinnedRank(right.id, pinnedRankMap)
  if (leftPinnedRank !== rightPinnedRank) {
    return leftPinnedRank - rightPinnedRank
  }

  const stargazerCountDiff = right.stargazerCount - left.stargazerCount
  if (stargazerCountDiff !== 0) {
    return stargazerCountDiff
  }

  const leftPushedAt = left.pushedAt ?? ''
  const rightPushedAt = right.pushedAt ?? ''
  if (leftPushedAt > rightPushedAt) {
    return -1
  }
  if (leftPushedAt < rightPushedAt) {
    return 1
  }

  return 0
}

export const transformGithubUserToData = (user: GithubUserData): DataResult => {
  const orderedPinnedNodeIds = getOrderedPinnedNodeIds(user)
  const pinnedRankMap = buildPinnedRankMap(orderedPinnedNodeIds)
  const repos: DataRepository[] = []

  for (const edge of user.repositories.edges ?? []) {
    const repo = edge?.node
    if (repo == null) {
      continue
    }
    const dataRepository = toDataRepository(repo, user.id, pinnedRankMap)
    if (dataRepository != null) {
      repos.push(dataRepository)
    }
  }

  const orderedRepos = repos.sort((left, right) => compareRepositories(left, right, pinnedRankMap))

  return DataResult.parse(
    {
      repositories: orderedRepos.slice(0, 40),
      avatarUrl: ensureString(user.avatarUrl, 'user avatar URL'),
      githubUrl: ensureString(user.url, 'user profile URL'),
      email: ensureEmail(user.email),
    } satisfies DataResult,
    { reportInput: true }
  )
}

const getData = async (): Promise<DataResult> => {
  const user = await getGithubUser().catch((error: unknown) => {
    throw new Error(`Error fetching github user: ${String(error)}`, { cause: error })
  })

  return transformGithubUserToData(user)
}

export async function getDataAction() {
  try {
    return await getData()
  } catch (error: unknown) {
    captureException(error)
    throw error
  }
}

const ensureHomepageUrl = (url: unknown): string | null => {
  if (typeof url !== 'string' || url.trim() === '') {
    return null
  }
  let result = url.trim()
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(result)) {
    result = `https://${result}`
  }
  return result
}

const ensureString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`Expected ${fieldName} to be a non-empty string`)
  }
  return value
}

const ensureNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

const ensureNonEmptyNullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

const Email = z.email()
const ensureEmail = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }
  const result = Email.safeParse(value)
  return result.success ? result.data : null
}
