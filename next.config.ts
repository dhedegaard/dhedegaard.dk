import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

// No Content-Security-Policy by design — see the "Key conventions" note in
// CLAUDE.md. It is hard to maintain correctly on this stack and the risk
// outweighs the benefit for a static site with no user-generated content.
const securityHeaders = [
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
    optimizePackageImports: ['zod/mini', 'lucide-react'],
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
    excludeTracing: true,
  },
})
