'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function ErrorPage({ error }: Readonly<{ error: Error & { digest?: string } }>) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return <h1 className="text-4xl">500: Internal Server Error</h1>
}
