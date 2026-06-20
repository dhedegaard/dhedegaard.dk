import { captureException } from '@sentry/nextjs'
import * as z from 'zod/mini'
import { getGithubUser } from '../clients/github'

const DataRepositoryLanguage = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  color: z.nullable(z.string().check(z.minLength(1))),
})
interface DataRepositoryLanguage extends z.infer<typeof DataRepositoryLanguage> {}

const DataRepositoryTopic = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
})
interface DataRepositoryTopic extends z.infer<typeof DataRepositoryTopic> {}

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
    DataRepositoryLanguage as z.ZodMiniType<DataRepositoryLanguage, DataRepositoryLanguage>
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

type DataRepositoryParseError = Extract<
  ReturnType<typeof DataRepository.safeParse>,
  { success: false }
>['error']

export interface DroppedRepository {
  id: string
  error: DataRepositoryParseError
}

export interface TransformResult {
  data: DataResult
  dropped: DroppedRepository[]
}

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

const extractLanguages = (repo: GithubRepoNode): DataRepositoryLanguage[] => {
  const seen = new Set<string>()
  return [repo.primaryLanguage, ...(repo.languages?.edges?.map((edge) => edge?.node) ?? [])].reduce<
    DataRepositoryLanguage[]
  >((acc, language) => {
    if (language == null || seen.has(language.id)) {
      return acc
    }
    seen.add(language.id)
    acc.push({ id: language.id, name: language.name, color: language.color ?? null })
    return acc
  }, [])
}

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

/** Parse a nullable ISO timestamp to epoch millis, treating null as the oldest possible. */
export const pushedAtTimestamp = (pushedAt: string | null): number =>
  pushedAt != null ? Date.parse(pushedAt) : Number.NEGATIVE_INFINITY

const toDataRepository = (
  repo: GithubRepoNode,
  userId: string,
  pinnedRankMap: ReadonlyMap<string, number>
): DataRepository | null => {
  if (repo.isPrivate || repo.isArchived || repo.owner.id !== userId) {
    return null
  }

  return {
    id: repo.id,
    name: repo.name,
    url: ensureString(repo.url, 'repository url'),
    pinned: pinnedRankMap.has(repo.id),
    description: ensureNonEmptyNullableString(repo.description),
    homepageUrl: ensureHomepageUrl(repo.homepageUrl),
    pushedAt: repo.pushedAt,
    stargazerCount: repo.stargazerCount,
    languages: extractLanguages(repo),
    topics: extractTopics(repo),
  } satisfies DataRepository
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

  const leftPushedAt = pushedAtTimestamp(left.pushedAt)
  const rightPushedAt = pushedAtTimestamp(right.pushedAt)
  if (leftPushedAt !== rightPushedAt) {
    return rightPushedAt - leftPushedAt
  }

  return 0
}

export const transformGithubUserToData = (user: GithubUserData): TransformResult => {
  const orderedPinnedNodeIds = getOrderedPinnedNodeIds(user)
  const pinnedRankMap = buildPinnedRankMap(orderedPinnedNodeIds)
  const repos: DataRepository[] = []
  const dropped: DroppedRepository[] = []

  for (const edge of user.repositories.edges ?? []) {
    const repo = edge?.node
    if (repo == null) {
      continue
    }
    const candidate = toDataRepository(repo, user.id, pinnedRankMap)
    if (candidate == null) {
      // Intentionally filtered out (private, archived, or not owned).
      continue
    }
    // Validate each repository in isolation so one malformed repo degrades to a
    // dropped repo rather than throwing and taking down the whole page.
    const parsed = DataRepository.safeParse(candidate)
    if (parsed.success) {
      repos.push(parsed.data)
    } else {
      dropped.push({ id: candidate.id, error: parsed.error })
    }
  }

  const orderedRepos = repos.sort((left, right) => compareRepositories(left, right, pinnedRankMap))

  const data = DataResult.parse(
    {
      repositories: orderedRepos.slice(0, 40),
      avatarUrl: ensureString(user.avatarUrl, 'user avatar URL'),
      githubUrl: ensureString(user.url, 'user profile URL'),
      email: ensureEmail(user.email),
    } satisfies DataResult,
    { reportInput: true }
  )

  return { data, dropped }
}

const getData = async (): Promise<DataResult> => {
  const user = await getGithubUser().catch((error: unknown) => {
    throw new Error(`Error fetching github user: ${String(error)}`, { cause: error })
  })

  const { data, dropped } = transformGithubUserToData(user)
  for (const { id, error } of dropped) {
    captureException(
      new Error(`Dropped repository ${id} that failed DataRepository validation`, { cause: error })
    )
  }
  return data
}

export async function getDataAction() {
  return await getData()
}

const HTTP_SCHEME_RE = /^https?:\/\//i
// A non-http(s) URI scheme (mailto:, tel:, ftp:, javascript:, ...). The negative
// lookahead for a digit keeps a scheme-less "host:port" (e.g. example.com:8080)
// from being mistaken for a scheme, since a port number follows the colon there.
const NON_HTTP_SCHEME_RE = /^[a-z][a-z\d+.-]*:(?!\d)/i
const HomepageUrl = z.url()
// A repository homepage is a website: normalize to an http(s) URL, or return
// null so the caller renders no link rather than a broken or invalid one.
const ensureHomepageUrl = (url: unknown): string | null => {
  if (typeof url !== 'string') {
    return null
  }
  const trimmed = url.trim()
  if (trimmed === '') {
    return null
  }

  let candidate: string
  if (HTTP_SCHEME_RE.test(trimmed)) {
    candidate = trimmed
  } else if (trimmed.startsWith('//')) {
    candidate = `https:${trimmed}`
  } else if (NON_HTTP_SCHEME_RE.test(trimmed)) {
    return null
  } else {
    candidate = `https://${trimmed}`
  }

  return HomepageUrl.safeParse(candidate).success ? candidate : null
}

const ensureString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`Expected ${fieldName} to be a non-empty string`)
  }
  return value
}

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
