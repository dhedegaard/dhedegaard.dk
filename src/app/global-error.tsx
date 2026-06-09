'use client'

import '../styles/globals.css'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: Readonly<{ error: Error & { digest?: string } }>) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <div className="mx-auto max-w-4xl px-6 max-md:px-4">
          <h1 className="mb-5 text-4xl">500: Internal Server Error</h1>
          <p className="mb-4">
            An unexpected error occurred: {String(error)}
            {error.digest != null && (
              <span className="block text-sm opacity-70">Reference: {error.digest}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.reload()
            }}
            className="text-blue-600 underline"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
