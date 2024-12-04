'use server'

import { captureException } from '@sentry/nextjs'
import orderBy from 'lodash-es/orderBy'
import uniqBy from 'lodash-es/uniqBy'
import { z } from 'zod'
import { getGithubUser } from '../clients/github'

const DataRepositorLanguage = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.nullable(z.string().min(1)),
})
export interface DataRepositoryLanguage extends z.TypeOf<typeof DataRepositorLanguage> {}

const DataRepositoryTopic = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})
export interface DataRepositoryTopic extends z.TypeOf<typeof DataRepositoryTopic> {}

const DataRepository = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  pinned: z.boolean(),
  description: z.nullable(z.string().min(1)),
  homepageUrl: z.nullable(z.string().url()),
  updatedAt: z.nullable(z.string().datetime({ offset: true })),
  pushedAt: z.nullable(z.string().datetime({ offset: true })),
  stargazerCount: z.number().int().nonnegative(),
  languages: z.array(DataRepositorLanguage as z.ZodType<DataRepositoryLanguage>),
  topics: z.array(DataRepositoryTopic as z.ZodType<DataRepositoryTopic>),
})
export interface DataRepository extends z.TypeOf<typeof DataRepository> {}

const DataResult = z.object({
  avatarUrl: z.string().url(),
  bio: z.nullable(z.string().min(1)),
  githubUrl: z.string().url(),
  email: z.string().email(),
  repositories: z.array(DataRepository as z.ZodType<DataRepository>),
})
export interface DataResult extends z.TypeOf<typeof DataResult> {}

const getData = async (): Promise<DataResult> => {
  const user = await getGithubUser().catch((error: unknown) => {
    console.error('Error fetching github user:', error)
    return null
  })

  if (user == null) {
    throw new Error('Github user not found')
  }

  const orderedPinnedNodeIds =
    user.pinnedItems.nodes
      ?.map((node) => node?.id)
      .filter((node): node is NonNullable<typeof node> => node != null) ?? []
  const repos =
    user.topRepositories.edges?.reduce<DataRepository[]>((result, edge) => {
      const repo = edge?.node
      if (repo == null || repo.isPrivate || repo.isArchived || repo.owner.id !== user.id) {
        return result
      }

      const languages: DataRepositoryLanguage[] = uniqBy(
        [repo.primaryLanguage, ...(repo.languages?.edges?.map((edge) => edge?.node) ?? [])].filter(
          (language): language is NonNullable<typeof language> => language != null
        ),
        (language) => language.id
      ).map(
        (language) =>
          ({
            id: language.id,
            name: language.name,
            color: language.color ?? null,
          }) satisfies DataRepositoryLanguage
      )
      const topics: DataRepositoryTopic[] =
        repo.repositoryTopics.edges
          ?.map((topic) => topic?.node ?? undefined)
          .filter((topic): topic is NonNullable<typeof topic> => topic != null)
          .map(
            (topic) =>
              ({
                id: topic.topic.id,
                name: topic.topic.name,
              }) satisfies DataRepositoryTopic
          ) ?? []
      const newItem: DataRepository = DataRepository.parse({
        id: repo.id,
        name: repo.name,
        url: repo.url as string,
        pinned: orderedPinnedNodeIds.includes(repo.id),
        description: repo.description ?? null,
        homepageUrl: ensureHomepageUrl(repo.homepageUrl),
        updatedAt: repo.updatedAt as string,
        pushedAt: repo.pushedAt as string,
        stargazerCount: repo.stargazerCount,
        languages,
        topics,
      } satisfies DataRepository)
      return [...result, newItem]
    }, []) ?? []
  const orderedRepos = orderBy(
    repos,
    [
      // Pinned repos ascending
      (repository) => {
        const index = orderedPinnedNodeIds.indexOf(repository.id)
        return index === -1 ? Infinity : index
      },
      'stargazerCount',
      'pushedAt',
    ],
    ['asc', 'desc', 'desc']
  )

  return await DataResult.parseAsync({
    repositories: orderedRepos.slice(0, 40),
    avatarUrl: user.avatarUrl as string,
    bio: user.bio ?? null,
    githubUrl: user.url as string,
    email: user.email,
  } satisfies DataResult)
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
  if (typeof url !== 'string' || url === '') {
    return null
  }
  let result = url
  if (!result.startsWith('http')) {
    result = `https://${result}`
  }
  return result
}
