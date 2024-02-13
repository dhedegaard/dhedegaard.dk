import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import favicon from '../../public/favicon.png'
import '../styles/globals.css'

const metadataBase = new URL('https://www.dhedegaard.dk/')
export const metadata: Metadata = {
  title: 'Dennis Hedegaard',
  keywords: 'Dennis Hedegaard, Dennis Elsborg Heick Hedegaard, dhedegaard',
  description: 'The personal website of Dennis Hedegaard',
  manifest: '/manifest.json',
  icons: favicon.src,
  metadataBase,
  robots: 'index, follow',
  appleWebApp: {
    capable: true,
    title: 'Dennis Hedegaard',
  },
  openGraph: {
    type: 'website',
    title: 'Dennis Hedegaard',
    siteName: 'Dennis Hedegaard',
    url: 'https://www.dhedegaard.dk/',
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
    <html lang="en">
      <head>
        <link rel="canonical" href={metadataBase.toString()} />
      </head>
      <body>
        <div className="max-w-4xl mx-auto px-6 max-md:px-4">{children}</div>
      </body>
    </html>
  )
}
