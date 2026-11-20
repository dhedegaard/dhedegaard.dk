import { captureException } from '@sentry/nextjs'
import * as z from 'zod/mini'
import { getGithubUser, type GithubRepositoryNode, type GithubUser } from '../clients/github'
import { computeLanguageStats, LanguageStats, uniqueLanguageEdges } from './compute-language-stats'
import {
  ensureEmail,
  ensureHomepageUrl,
  ensureNonEmptyNullableString,
  ensureString,
} from './sanitize'

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
  archived: z.boolean(),
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
  email: z.email(),
  repositories: z.array(DataRepository as z.ZodMiniType<DataRepository, DataRepository>),
  languageStats: LanguageStats,
})
export interface DataResult extends z.infer<typeof DataResult> {}

type DataRepositoryParseError = Extract<
  ReturnType<typeof DataRepository.safeParse>,
  { success: false }
>['error']

interface DroppedRepository {
  id: string
  error: DataRepositoryParseError
}

interface TransformResult {
  data: DataResult
  dropped: DroppedRepository[]
}

// Shown when GitHub has no public email.
const FALLBACK_EMAIL = 'dennis@dhedegaard.dk'

// Pinned repository ids mapped to their position on the profile.
const buildPinnedRankMap = (user: GithubUser): ReadonlyMap<string, number> =>
  new Map(
    (user.pinnedItems.nodes ?? [])
      .flatMap((node) => (node?.__typename === 'Repository' ? [node.id] : []))
      .map((id, rank) => [id, rank])
  )

const extractLanguages = (repo: GithubRepositoryNode): DataRepositoryLanguage[] => {
  const primary = repo.primaryLanguage
  const languages = uniqueLanguageEdges(repo).map((edge) => edge.node)
  return (
    primary == null
      ? languages
      : [primary, ...languages.filter((language) => language.id !== primary.id)]
  ).map((language) => ({ id: language.id, name: language.name, color: language.color ?? null }))
}

const extractTopics = (repo: GithubRepositoryNode): DataRepositoryTopic[] =>
  repo.repositoryTopics.edges
    ?.map((topic) => topic?.node ?? undefined)
    .filter((topic): topic is NonNullable<typeof topic> => topic != null)
    // A topic that only repeats the repo name adds nothing to the card.
    .filter((topic) => topic.topic.name.toLowerCase() !== repo.name.toLowerCase())
    .map((topic) => ({
      id: topic.topic.id,
      name: topic.topic.name,
    })) ?? []

/** Parse a nullable ISO timestamp to epoch millis, treating null as the oldest possible. */
export const pushedAtTimestamp = (pushedAt: string | null): number =>
  pushedAt != null ? Date.parse(pushedAt) : Number.NEGATIVE_INFINITY

const toDataRepository = (
  repo: GithubRepositoryNode,
  userId: string,
  pinnedRankMap: ReadonlyMap<string, number>
): DataRepository | null => {
  if (repo.isPrivate || repo.owner.id !== userId) {
    return null
  }

  return {
    id: repo.id,
    name: repo.name,
    url: ensureString(repo.url, 'repository url'),
    pinned: pinnedRankMap.has(repo.id),
    archived: repo.isArchived,
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
  return (
    Number(left.archived) - Number(right.archived) ||
    // Unpinned repos rank after every pinned one.
    compareNumbers(
      pinnedRankMap.get(left.id) ?? Infinity,
      pinnedRankMap.get(right.id) ?? Infinity
    ) ||
    right.stargazerCount - left.stargazerCount ||
    compareNumbers(pushedAtTimestamp(right.pushedAt), pushedAtTimestamp(left.pushedAt))
  )
}

// Ascending order that, unlike subtraction, ties equal infinities instead of giving NaN.
const compareNumbers = (left: number, right: number): number =>
  left < right ? -1 : left > right ? 1 : 0

export const transformGithubUserToData = (user: GithubUser): TransformResult => {
  const pinnedRankMap = buildPinnedRankMap(user)
  const repos: DataRepository[] = []
  const statsRepos: GithubRepositoryNode[] = []
  const dropped: DroppedRepository[] = []

  for (const edge of user.repositories.edges ?? []) {
    const repo = edge?.node
    if (repo == null) {
      continue
    }
    const candidate = toDataRepository(repo, user.id, pinnedRankMap)
    if (candidate == null) {
      // Intentionally filtered out (private or not owned).
      continue
    }
    // Validate each repository in isolation so one malformed repo degrades to a
    // dropped repo rather than throwing and taking down the whole page.
    const parsed = DataRepository.safeParse(candidate)
    if (parsed.success) {
      repos.push(parsed.data)
      statsRepos.push(repo)
    } else {
      dropped.push({ id: candidate.id, error: parsed.error })
    }
  }

  const orderedRepos = repos.sort((left, right) => compareRepositories(left, right, pinnedRankMap))

  const data = DataResult.parse(
    {
      repositories: orderedRepos,
      languageStats: computeLanguageStats(statsRepos),
      avatarUrl: ensureString(user.avatarUrl, 'user avatar URL'),
      githubUrl: ensureString(user.url, 'user profile URL'),
      email: ensureEmail(user.email) ?? FALLBACK_EMAIL,
    } satisfies DataResult,
    { reportInput: true }
  )

  return { data, dropped }
}

export async function getGithubData(): Promise<DataResult> {
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
