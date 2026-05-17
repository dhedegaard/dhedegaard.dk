import '../styles/globals.css'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { preconnect } from 'react-dom'

const metadataBase = new URL('https://www.dhedegaard.dk/')
const gravatarAvatar =
  'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f'

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
    images: [
      {
        url: `${gravatarAvatar}?s=512`,
      },
      {
        url: `${gravatarAvatar}?s=512`,
        width: 512,
        height: 512,
      },
      {
        url: `${gravatarAvatar}?s=256`,
        width: 256,
        height: 256,
      },
      {
        url: `${gravatarAvatar}?s=128`,
        width: 128,
        height: 128,
      },
    ],
  },
  openGraph: {
    type: 'website',
    title: 'Dennis Hedegaard',
    siteName: 'Dennis Hedegaard',
    url: 'https://www.dhedegaard.dk/',
    description: 'The personal website of Dennis Hedegaard',
    images: [
      {
        url: `${gravatarAvatar}?s=512`,
      },
      {
        url: `${gravatarAvatar}?s=512`,
        width: 512,
        height: 512,
      },
      {
        url: `${gravatarAvatar}?s=256`,
        width: 256,
        height: 256,
      },
      {
        url: `${gravatarAvatar}?s=128`,
        width: 128,
        height: 128,
      },
    ],
  },
} satisfies Metadata

export const viewport: Viewport = {
  themeColor: '#fff',
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
      </head>
      <body className="overflow-y-visible">
        <div className="mx-auto max-w-4xl px-6 max-md:px-4">{children}</div>

        <Analytics debug={false} />
        <SpeedInsights debug={false} />
      </body>
    </html>
  )
}
