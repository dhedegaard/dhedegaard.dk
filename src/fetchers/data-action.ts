'use server'

import { captureException } from '@sentry/nextjs'
import orderBy from 'lodash-es/orderBy'
import uniqBy from 'lodash-es/uniqBy'
import { cache } from 'react'
import { z } from 'zod/v4-mini'
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
  updatedAt: z.nullable(z.iso.datetime({ offset: true })),
  pushedAt: z.nullable(z.iso.datetime({ offset: true })),
  stargazerCount: z.int().check(z.nonnegative()),
  languages: z.array(DataRepositorLanguage as z.ZodMiniType<DataRepositoryLanguage>),
  topics: z.array(DataRepositoryTopic as z.ZodMiniType<DataRepositoryTopic>),
})
export interface DataRepository extends z.infer<typeof DataRepository> {}

const DataResult = z.object({
  avatarUrl: z.url(),
  bio: z.nullable(z.string().check(z.minLength(1))),
  githubUrl: z.url(),
  email: z.email(),
  repositories: z.array(DataRepository as z.ZodMiniType<DataRepository>),
})
export interface DataResult extends z.infer<typeof DataResult> {}

const getData = async (): Promise<DataResult> => {
  const user = await getGithubUser().catch((error: unknown) => {
    throw new Error(`Error fetching github user: ${String(error)}`, { cause: error })
  })

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

const cachedGetData = cache(getData)

export const getDataAction = cache(async function getDataAction() {
  try {
    return await cachedGetData()
  } catch (error: unknown) {
    captureException(error)
    throw error
  }
})

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
