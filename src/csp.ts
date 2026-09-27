interface CspOptions {
  isDev: boolean
  vercelEnv: string | undefined
  sentryDsn: string | undefined
}

// Per Vercel's toolbar CSP docs.
const vercelToolbar: Record<string, string[]> = {
  'script-src': ['https://vercel.live'],
  'connect-src': ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  'img-src': ['https://vercel.live', 'https://vercel.com'],
  'style-src': ['https://vercel.live'],
  'font-src': ['https://vercel.live', 'https://assets.vercel.com'],
  'frame-src': ["'self'", 'https://vercel.live'],
}

// Sentry's security endpoint, see "Security Policy Reporting" in the Sentry docs.
function sentryReportUrl(dsn: URL, vercelEnv: string | undefined): string {
  const url = new URL(dsn.pathname.replace(/\/(\d+)$/, '/api/$1/security/'), dsn.origin)
  url.searchParams.set('sentry_key', dsn.username)
  // Matches the environment name the Sentry SDK derives from VERCEL_ENV.
  if (vercelEnv) url.searchParams.set('sentry_environment', `vercel-${vercelEnv}`)
  return url.toString()
}

/**
 * Enforced CSP headers. Static (no nonces) so pages stay prerendered, which
 * means `'unsafe-inline'` scripts — see CLAUDE.md.
 */
export function cspHeaders({
  isDev,
  vercelEnv,
  sentryDsn,
}: CspOptions): { key: string; value: string }[] {
  const dsn = URL.parse(sentryDsn ?? '')
  const reportUrl = dsn ? sentryReportUrl(dsn, vercelEnv) : undefined

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // React dev tooling relies on eval.
    'script-src': ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // next/image renders inline style attributes.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https://gravatar.com'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...(dsn ? [dsn.origin] : [])],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    // Skipped in dev: Safari would upgrade http://localhost too.
    ...(isDev ? {} : { 'upgrade-insecure-requests': [] }),
  }
  if (vercelEnv === 'preview') {
    for (const [name, values] of Object.entries(vercelToolbar)) {
      directives[name] = [...(directives[name] ?? []), ...values]
    }
  }
  if (reportUrl) {
    directives['report-uri'] = [reportUrl]
    directives['report-to'] = ['csp-endpoint']
  }

  const policy = Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ')

  return [
    { key: 'Content-Security-Policy', value: policy },
    ...(reportUrl ? [{ key: 'Reporting-Endpoints', value: `csp-endpoint="${reportUrl}"` }] : []),
  ]
}
