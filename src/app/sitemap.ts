import { MetadataRoute } from 'next'
import { cacheLife } from 'next/cache'

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
