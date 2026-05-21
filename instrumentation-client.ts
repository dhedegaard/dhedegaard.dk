import { init } from '@sentry/nextjs'
import { sentryCommonOptions } from './sentry.shared-options'

init({
  ...sentryCommonOptions,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
})

export { captureRouterTransitionStart as onRouterTransitionStart } from '@sentry/nextjs'
