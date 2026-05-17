import { init } from '@sentry/nextjs'

init({
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'] ?? '',
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  debug: false,
  ignoreErrors: ['Suspense Exception'],
})

export { captureRouterTransitionStart as onRouterTransitionStart } from '@sentry/nextjs'
