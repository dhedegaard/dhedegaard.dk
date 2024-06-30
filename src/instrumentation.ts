import * as Sentry from '@sentry/nextjs'

export function register() {
  Sentry.init({
    dsn: 'https://3e5c43b4cf4d92403a9ab2f22b07e1a0@o59230.ingest.sentry.io/4506576747429888',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    ignoreErrors: [/Suspense Exception/],
  })
}
