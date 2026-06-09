'use client'

import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'

export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <>
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
          startTransition(() => {
            router.refresh()
            reset()
          })
        }}
        disabled={isPending}
        className="text-blue-600 underline disabled:opacity-50"
      >
        {isPending ? 'Retrying…' : 'Try again'}
      </button>
    </>
  )
}
