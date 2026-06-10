import '../styles/globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { preconnect } from 'react-dom'
import { SITE_URL } from '../site'

const metadataBase = new URL(SITE_URL)
const gravatarAvatar =
  'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f'

const gravatarImages = [
  { url: `${gravatarAvatar}?s=512` },
  { url: `${gravatarAvatar}?s=512`, width: 512, height: 512 },
  { url: `${gravatarAvatar}?s=256`, width: 256, height: 256 },
  { url: `${gravatarAvatar}?s=128`, width: 128, height: 128 },
]

// Structured data for search engines: identifies the site's subject (Person)
// and the site itself (WebSite), linked via @id so the person is the author.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: 'Dennis Hedegaard',
      alternateName: 'Dennis Elsborg Heick Hedegaard',
      url: SITE_URL,
      image: gravatarAvatar,
      sameAs: [
        'https://github.com/dhedegaard',
        'https://www.linkedin.com/in/dennis-hedegaard-39a02a22/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Dennis Hedegaard',
      description: 'The personal website of Dennis Hedegaard',
      inLanguage: 'en',
      author: { '@id': `${SITE_URL}/#person` },
    },
  ],
}

export const metadata: Metadata = {
  title: 'Dennis Hedegaard',
  keywords: 'Dennis Hedegaard, Dennis Elsborg Heick Hedegaard, dhedegaard',
  description: 'The personal website of Dennis Hedegaard',
  manifest: '/manifest.json',
  icons: gravatarAvatar,
  metadataBase,
  appleWebApp: {
    capable: true,
    title: 'Dennis Hedegaard',
  },
  twitter: {
    title: 'Dennis Hedegaard',
    description: 'The personal website of Dennis Hedegaard',
    card: 'summary',
    images: gravatarImages,
  },
  openGraph: {
    type: 'website',
    title: 'Dennis Hedegaard',
    siteName: 'Dennis Hedegaard',
    url: metadataBase.toString(),
    description: 'The personal website of Dennis Hedegaard',
    images: gravatarImages,
  },
} satisfies Metadata

export const viewport: Viewport = {
  themeColor: '#ffffff',
  initialScale: 1,
  width: 'device-width',
} satisfies Viewport

interface Props {
  children: ReactNode
}
export default function RootLayout({ children }: Readonly<Props>) {
  preconnect('https://avatars.githubusercontent.com')

  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={metadataBase.toString()} />
        <script
          type="application/ld+json"
          // Static, trusted data; escape "<" so a value can never break out of the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body>
        <div className="mx-auto max-w-4xl px-6 max-md:px-4">{children}</div>

        <Analytics debug={false} />
        <SpeedInsights debug={false} />
      </body>
    </html>
  )
}
