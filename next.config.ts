import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

// Shipped as report-only first: it blocks nothing, only reports violations, so we
// can watch a deployed build before enforcing. `'unsafe-inline'` for scripts is
// required because Next's App Router emits inline RSC-payload scripts and we keep
// the site fully static (a nonce would force dynamic rendering). Origins: gravatar
// serves the favicon/PWA icons; Sentry ingests errors directly from the browser.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://gravatar.com",
  "font-src 'self'",
  "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
  // Force HTTPS for two years, including subdomains. Vercel does not set this by
  // default. `preload` opts into the browser preload list (requires submission
  // at hstspreload.org); drop it if any subdomain must stay HTTP.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Disallow MIME-type sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send only the origin on cross-origin requests, full URL same-origin.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Anti-clickjacking backstop for browsers without CSP frame-ancestors.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Disable browser features the site never uses.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
]

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
    ],
  },
  experimental: {
    optimizePackageImports: ['zod/mini'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default withSentryConfig(config, {
  // Suppresses source map uploading logs during build
  silent: true,
  org: 'dennis-hedegaard',
  project: 'dhedegaarddk',

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

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
