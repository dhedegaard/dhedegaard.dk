import withBundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        pathname: '**',
      },
    ],
  },
}

// Injected content via Sentry wizard below

export default withBundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
  openAnalyzer: false,
})(
  withSentryConfig(config, {
    // Suppresses source map uploading logs during build
    silent: true,
    org: 'dennis-hedegaard',
    project: 'dhedegaarddk',

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },

    bundleSizeOptimizations: {
      excludeDebugStatements: true,
      excludeReplayIframe: true,
      excludeReplayShadowDom: true,
      excludeReplayWorker: true,
      excludeTracing: true,
    },
  })
)
