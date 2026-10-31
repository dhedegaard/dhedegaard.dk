import '../styles/globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { SITE_URL } from '../site'
import { JSON_LD } from './json-ld'
import { GRAVATAR_AVATAR, SITE_DESCRIPTION, SITE_NAME } from './site-meta'

// Fail the build if any route stops being fully static — see CLAUDE.md.
export const ensureStatic = 'navigation'

const metadataBase = new URL(SITE_URL)
const gravatarImages = [
  { url: `${GRAVATAR_AVATAR}?s=512`, width: 512, height: 512 },
  { url: `${GRAVATAR_AVATAR}?s=256`, width: 256, height: 256 },
  { url: `${GRAVATAR_AVATAR}?s=128`, width: 128, height: 128 },
]

export const metadata: Metadata = {
  title: SITE_NAME,
  keywords: 'Dennis Hedegaard, Dennis Elsborg Heick Hedegaard, dhedegaard',
  description: SITE_DESCRIPTION,
  manifest: '/manifest.json',
  icons: GRAVATAR_AVATAR,
  metadataBase,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
  },
  twitter: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    card: 'summary',
    images: gravatarImages,
  },
  openGraph: {
    type: 'website',
    title: SITE_NAME,
    siteName: SITE_NAME,
    url: metadataBase.toString(),
    description: SITE_DESCRIPTION,
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
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={metadataBase.toString()} />
        <script
          type="application/ld+json"
          // Static, trusted data; escape "<" so a value can never break out of the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c') }}
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
