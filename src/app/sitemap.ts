import { cacheLife } from 'next/cache'
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  'use cache'
  cacheLife('days')

  return [
    {
      url: 'https://www.dhedegaard.dk/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
