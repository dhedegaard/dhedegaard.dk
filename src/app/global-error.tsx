'use client'

import '../styles/globals.css'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error }: Readonly<{ error: Error }>) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <h1 className="text-4xl">500: Internal Server Error</h1>
      </body>
    </html>
  )
}
