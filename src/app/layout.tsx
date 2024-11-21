import '../styles/globals.css'

import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

const metadataBase = new URL('https://www.dhedegaard.dk/')
export const metadata: Metadata = {
  title: 'Dennis Hedegaard',
  keywords: 'Dennis Hedegaard, Dennis Elsborg Heick Hedegaard, dhedegaard',
  description: 'The personal website of Dennis Hedegaard',
  manifest: '/manifest.json',
  icons:
    'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f',
  metadataBase,
  robots: 'index, follow',
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
        url: 'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=512',
      },
      {
        url: 'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=512',
        width: 512,
        height: 512,
      },
      {
        url: 'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=256',
        width: 256,
        height: 256,
      },
      {
        url: 'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=128',
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
        url: 'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=512',
      },
      {
        url: 'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=512',
        width: 512,
        height: 512,
      },
      {
        url: 'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=256',
        width: 256,
        height: 256,
      },
      {
        url: 'https://gravatar.com/avatar/d3fc3961d888b6792ee5b869bc64094527509d6ee9eb1e60bde5854009eb640f?s=128',
        width: 128,
        height: 128,
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#fff',
  initialScale: 1,
  width: 'device-width',
}

interface Props {
  children: ReactNode
}
export default function RootLayout({ children }: Readonly<Props>) {
  return (
    <>
      <Analytics />
      <html lang="en">
        <head>
          <link rel="canonical" href={metadataBase.toString()} />
        </head>
        <body>
          <div className="mx-auto max-w-4xl px-6 max-md:px-4">{children}</div>
        </body>
      </html>
    </>
  )
}
