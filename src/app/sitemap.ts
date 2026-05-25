import { MetadataRoute } from 'next'
import { cacheLife } from 'next/cache'
import { getDataAction } from '../fetchers/data-action'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache'
  cacheLife('days')

  const { repositories } = await getDataAction()
  const latestPushedAt = repositories.reduce(
    (latest, repo) =>
      Math.max(
        latest,
        repo.pushedAt != null ? Date.parse(repo.pushedAt) : Number.NEGATIVE_INFINITY
      ),
    Number.NEGATIVE_INFINITY
  )

  return [
    {
      url: 'https://www.dhedegaard.dk/',
      lastModified: Number.isFinite(latestPushedAt) ? new Date(latestPushedAt) : undefined,
      changeFrequency: 'daily',
      priority: 1,
    },
  ] satisfies MetadataRoute.Sitemap
}
