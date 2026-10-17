import type { init } from '@sentry/nextjs'

export const sentryCommonOptions = {
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'] ?? '',
  debug: false,
  ignoreErrors: ['Suspense Exception'],
  // Sentry 11 collects more by default; this keeps the v10 baseline.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
      response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    },
    httpBodies: [],
    urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    graphQL: { document: false, variables: false },
  },
} satisfies Parameters<typeof init>[0]
