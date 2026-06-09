import { captureException } from '@sentry/nextjs'

/**
 * Formats a repository homepage URL for compact display: drops the scheme and a
 * bare "/" path while preserving any path, query, and hash. Falls back to the
 * original string if it cannot be parsed — defensive only, since homepage URLs
 * are already validated to be valid http(s) URLs upstream in data-action.ts.
 */
export const formatHomepageUrl = (homepageUrl: string): string => {
  try {
    const url = new URL(homepageUrl)
    const tail = `${url.pathname === '/' ? '' : url.pathname}${url.search}${url.hash}`
    return `${url.host}${tail}`
  } catch (error: unknown) {
    console.error(error)
    captureException(error)
    return homepageUrl
  }
}
