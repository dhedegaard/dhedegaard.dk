import { MetadataRoute } from 'next'
import { cacheLife } from 'next/cache'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache'
  cacheLife('days')

  return await Promise.resolve([
    {
      url: 'https://www.dhedegaard.dk/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ] satisfies MetadataRoute.Sitemap)
}
