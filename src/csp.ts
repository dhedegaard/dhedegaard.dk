/** Route that receives CSP violation reports (see `src/app/api/csp-report`). */
export const CSP_REPORT_PATH = '/api/csp-report'

/** Reporting API group name, declared via the `Reporting-Endpoints` header. */
export const CSP_REPORT_GROUP = 'csp-endpoint'

interface CspOptions {
  isDev: boolean
  isPreview: boolean
  sentryDsn: string | undefined
}

type Directives = Record<string, readonly string[]>

// Directives for the Vercel preview toolbar, per Vercel's toolbar CSP docs.
const vercelToolbar: Directives = {
  'script-src': ['https://vercel.live'],
  'connect-src': ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  'img-src': ['https://vercel.live', 'https://vercel.com'],
  'style-src': ['https://vercel.live'],
  'font-src': ['https://vercel.live', 'https://assets.vercel.com'],
  'frame-src': ["'self'", 'https://vercel.live'],
}

/** Origin the Sentry browser SDK posts envelopes to, derived from the DSN. */
export function sentryIngestOrigin(dsn: string | undefined): string | undefined {
  if (!dsn || !URL.canParse(dsn)) return undefined
  return new URL(dsn).origin
}

function merge(base: Directives, extra: Directives): Directives {
  const merged: Record<string, readonly string[]> = { ...base }
  for (const [name, values] of Object.entries(extra)) {
    merged[name] = [...new Set([...(merged[name] ?? []), ...values])]
  }
  return merged
}

/**
 * Static CSP — `'unsafe-inline'` scripts rather than nonces so pages stay
 * statically prerendered (no proxy/middleware). See CLAUDE.md.
 */
export function buildCsp({ isDev, isPreview, sentryDsn }: CspOptions): string {
  const sentryOrigin = sentryIngestOrigin(sentryDsn)

  let directives: Directives = {
    'default-src': ["'self'"],
    // React dev tooling relies on eval.
    'script-src': ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // next/image renders inline style attributes.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https://gravatar.com'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...(sentryOrigin ? [sentryOrigin] : [])],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  }
  if (isPreview) directives = merge(directives, vercelToolbar)
  directives = merge(directives, {
    'report-uri': [CSP_REPORT_PATH],
    'report-to': [CSP_REPORT_GROUP],
  })

  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ')
}
