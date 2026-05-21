export const sentryCommonOptions = {
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'] ?? '',
  debug: false,
  ignoreErrors: ['Suspense Exception'],
}
