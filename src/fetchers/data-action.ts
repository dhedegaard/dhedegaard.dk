'use server'

import { captureException } from '@sentry/nextjs'
import { orderBy, uniqBy } from 'lodash'
import { z } from 'zod'
import { getGithubUser } from '../clients/github'

const dataRepositorLanguageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.nullable(z.string().min(1)),
})
export interface DataRepositoryLanguage extends z.TypeOf<typeof dataRepositorLanguageSchema> {}

const dataRepositoryTopicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})
export interface DataRepositoryTopic extends z.TypeOf<typeof dataRepositoryTopicSchema> {}

const dataRepositorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  pinned: z.boolean(),
  description: z.nullable(z.string().min(1)),
  homepageUrl: z.nullable(z.string().url()),
  updatedAt: z.nullable(z.string().datetime({ offset: true })),
  pushedAt: z.nullable(z.string().datetime({ offset: true })),
  stargazerCount: z.number().int().nonnegative(),
  languages: z.array(dataRepositorLanguageSchema as z.ZodType<DataRepositoryLanguage>),
  topics: z.array(dataRepositoryTopicSchema as z.ZodType<DataRepositoryTopic>),
})
export interface DataRepository extends z.TypeOf<typeof dataRepositorySchema> {}

const dataResultSchema = z.object({
  avatarUrl: z.string().url(),
  bio: z.nullable(z.string().min(1)),
  githubUrl: z.string().url(),
  email: z.string().email(),
  repositories: z.array(dataRepositorySchema as z.ZodType<DataRepository>),
})
export interface DataResult extends z.TypeOf<typeof dataResultSchema> {}

const getData = async (): Promise<DataResult> => {
  const user = await getGithubUser().catch((error) => {
    console.error('Error fetching github user:', error)
    return undefined
  })

  if (user == null) {
    throw new Error('Github user not found')
  }

  const orderedPinnedNodeIds =
    user.pinnedItems?.nodes
      ?.map((e) => e?.id)
      .filter((e): e is NonNullable<typeof e> => e != null) ?? []
  const repos =
    user.topRepositories?.edges?.reduce<DataRepository[]>((acc, edge) => {
      const repo = edge?.node
      if (repo == null || repo.isPrivate || repo.isArchived || repo.owner.id !== user.id) {
        return acc
      }

      const languages: DataRepositoryLanguage[] = uniqBy(
        [repo.primaryLanguage, ...(repo.languages?.edges?.map((e) => e?.node) ?? [])].filter(
          (e): e is NonNullable<typeof e> => e != null
        ),
        (e) => e.id
      ).map((language) => {
        const result: DataRepositoryLanguage = {
          id: language.id,
          name: language.name,
          color: language.color ?? null,
        }
        return result
      })
      const topics: DataRepositoryTopic[] =
        repo.repositoryTopics.edges
          ?.map((topic) => topic?.node ?? undefined)
          ?.filter((e): e is NonNullable<typeof e> => e != null)
          .map((topic) => {
            const result: DataRepositoryTopic = {
              id: topic.topic.id,
              name: topic.topic.name,
            }
            return result
          }) ?? []
      const newItem: DataRepository = {
        id: repo.id,
        name: repo.name,
        url: repo.url,
        pinned: orderedPinnedNodeIds.includes(repo.id),
        description: repo.description ?? null,
        homepageUrl: ensureHomepageUrl(repo.homepageUrl),
        updatedAt: repo.updatedAt,
        pushedAt: repo.pushedAt,
        stargazerCount: repo.stargazerCount,
        languages,
        topics,
      }
      acc.push(newItem)
      return acc
    }, []) ?? []
  const orderedRepos = orderBy(
    repos,
    [
      // Pinned repos ascending
      (e) => {
        const index = orderedPinnedNodeIds.indexOf(e.id)
        return index === -1 ? Infinity : index
      },
      'stargazerCount',
      'pushedAt',
    ],
    ['asc', 'desc', 'desc']
  )

  const result: DataResult = {
    repositories: orderedRepos.slice(0, 40),
    avatarUrl: user.avatarUrl,
    bio: user.bio ?? null,
    githubUrl: user.url,
    email: user.email,
  }
  return await dataResultSchema.parseAsync(result)
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
