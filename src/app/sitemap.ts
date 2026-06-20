import { captureException } from '@sentry/nextjs'
import { MetadataRoute } from 'next'
import { cacheLife } from 'next/cache'
import { getDataAction, pushedAtTimestamp } from '../fetchers/data-action'
import { SITE_URL } from '../site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache'
  cacheLife('days')

  let latestPushedAt = Number.NEGATIVE_INFINITY
  try {
    const { repositories } = await getDataAction()
    latestPushedAt = repositories.reduce(
      (latest, repo) => Math.max(latest, pushedAtTimestamp(repo.pushedAt)),
      Number.NEGATIVE_INFINITY
    )
  } catch (error: unknown) {
    console.error(error)
    captureException(error)
  }

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: Number.isFinite(latestPushedAt) ? new Date(latestPushedAt) : undefined,
      changeFrequency: 'daily',
      priority: 1,
    },
  ] satisfies MetadataRoute.Sitemap
}
