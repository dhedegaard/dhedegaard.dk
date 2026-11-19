import * as Sentry from '@sentry/nextjs'
import { useEffect, type ReactNode } from 'react'

export type RouteError = Error & { digest?: string }

/** Reports the error to Sentry once per error. */
export function useCaptureError(error: RouteError) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
}

interface ErrorMessageProps {
  error: RouteError
  /** The retry control, which differs between the route and root error pages. */
  children: ReactNode
}

/** The 500 message shared by `error.tsx` and `global-error.tsx`. */
export function ErrorMessage({ error, children }: ErrorMessageProps) {
  return (
    <>
      <h1 className="mb-5 text-4xl">500: Internal Server Error</h1>
      <p className="mb-4">
        An unexpected error occurred: {String(error)}
        {error.digest != null && (
          <span className="block text-sm opacity-70">Reference: {error.digest}</span>
        )}
      </p>
      {children}
    </>
  )
}
