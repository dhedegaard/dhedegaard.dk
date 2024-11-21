'use client'

import useSWRImmutable from 'swr/immutable'
import { getDataAction, type DataResult } from './data-action'
import type { SWRResponse } from 'swr'
import { useEffect } from 'react'
import { captureException } from '@sentry/nextjs'

const key = 'data'

export const useData = (): SWRResponse<DataResult, unknown> => {
  const response = useSWRImmutable(key, getDataAction)

  useEffect(() => {
    if (response.error != null) {
      console.error(response.error)
      captureException(response.error)
    }
  }, [response.error])

  return response
}
