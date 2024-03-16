'use server'

import { captureException } from '@sentry/nextjs'

const getData = async () => {
  const user = await getGithubUser().catch((error) => {
    console.error('Error fetching github user:', error)
    return undefined
  })

  if (user == null) {
    return {
      avatarUrl: null,
      bio: null,
      repositories: [],
      githubUrl: null,
      email: null,
    }
  }

  const orderedPinnedNodeIds =
    user.pinnedItems?.nodes
      ?.map((e) => e?.id)
      .filter((e): e is NonNullable<typeof e> => e != null) ?? []
  const repos =
    user.topRepositories?.edges?.reduce<GithubRepository[]>((acc, edge) => {
      const repo = edge?.node
      if (repo == null || repo.isPrivate || repo.isArchived || repo.owner.id !== user.id) {
        return acc
      }

      acc.push({
        id: repo.id,
        name: repo.name,
        url: repo.url,
        pinned: orderedPinnedNodeIds.includes(repo.id),
        description: repo.description ?? null,
        homepageUrl: ensureHomepageUrl(repo.homepageUrl),
        updatedAt: repo.updatedAt,
        pushedAt: repo.pushedAt,
        stargazerCount: repo.stargazerCount,
        languages: uniqBy(
          [repo.primaryLanguage, ...(repo.languages?.edges?.map((e) => e?.node) ?? [])].filter(
            (e): e is NonNullable<typeof e> => e != null
          ),
          (e) => e.id
        ),
        topics:
          repo.repositoryTopics.edges
            ?.map((topic) => topic?.node ?? undefined)
            ?.filter((e): e is NonNullable<typeof e> => e != null) ?? [],
      })
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

  return {
    repositories: orderedRepos.slice(0, 40),
    avatarUrl: user?.avatarUrl,
    bio: user?.bio,
    githubUrl: user?.url,
    email: user?.email,
  }
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
