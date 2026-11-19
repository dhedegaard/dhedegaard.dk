'use client'

import '../styles/globals.css'
import { ErrorMessage, type RouteError, useCaptureError } from './error-message'

export default function GlobalError({ error }: Readonly<{ error: RouteError }>) {
  useCaptureError(error)

  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <div className="mx-auto max-w-4xl px-6 max-md:px-4">
          <ErrorMessage error={error}>
            <button
              type="button"
              onClick={() => {
                window.location.reload()
              }}
              className="text-blue-600 underline hover:text-blue-700"
            >
              Try again
            </button>
          </ErrorMessage>
        </div>
      </body>
    </html>
  )
}
