'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ErrorMessage, type RouteError, useCaptureError } from './error-message'

export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: RouteError; reset: () => void }>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  useCaptureError(error)

  return (
    <ErrorMessage error={error}>
      <button
        type="button"
        onClick={() => {
          startTransition(() => {
            router.refresh()
            reset()
          })
        }}
        disabled={isPending}
        className="text-blue-600 underline hover:text-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Retrying…' : 'Try again'}
      </button>
    </ErrorMessage>
  )
}
