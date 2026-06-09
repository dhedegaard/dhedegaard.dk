import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://www.dhedegaard.dk/sitemap.xml',
  } satisfies MetadataRoute.Robots
}
