import { init } from '@sentry/nextjs'
import { sentryCommonOptions } from './sentry.shared-options'

init({
  ...sentryCommonOptions,
})

export { captureRouterTransitionStart as onRouterTransitionStart } from '@sentry/nextjs'
