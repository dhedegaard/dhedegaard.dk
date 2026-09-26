import { describe, expect, it } from 'vitest'
import { cspHeaders } from '../csp'

const DSN = 'https://abc123@o42.ingest.de.sentry.io/1337'
const REPORT_URL =
  'https://o42.ingest.de.sentry.io/api/1337/security/?sentry_key=abc123&sentry_environment=vercel-production'

const policy = (headers: ReturnType<typeof cspHeaders>) =>
  headers.find((h) => h.key === 'Content-Security-Policy-Report-Only')?.value ?? ''

describe('cspHeaders', () => {
  it('builds the production policy reporting to Sentry', () => {
    expect(cspHeaders({ isDev: false, vercelEnv: 'production', sentryDsn: DSN })).toEqual([
      {
        key: 'Content-Security-Policy-Report-Only',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://gravatar.com",
          "font-src 'self'",
          "connect-src 'self' https://o42.ingest.de.sentry.io",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          `report-uri ${REPORT_URL}`,
          'report-to csp-endpoint',
        ].join('; '),
      },
      { key: 'Reporting-Endpoints', value: `csp-endpoint="${REPORT_URL}"` },
    ])
  })

  it('omits reporting when no DSN is configured', () => {
    const headers = cspHeaders({ isDev: false, vercelEnv: undefined, sentryDsn: undefined })
    expect(headers).toHaveLength(1)
    expect(policy(headers)).toContain("connect-src 'self';")
    expect(policy(headers)).not.toContain('report-')
  })

  it("adds 'unsafe-eval' in development", () => {
    const headers = cspHeaders({ isDev: true, vercelEnv: undefined, sentryDsn: DSN })
    expect(policy(headers)).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval';")
  })

  it('allows the Vercel toolbar on preview deployments', () => {
    const csp = policy(cspHeaders({ isDev: false, vercelEnv: 'preview', sentryDsn: DSN }))
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://vercel.live;")
    expect(csp).toContain("frame-src 'self' https://vercel.live;")
    expect(csp).toContain('sentry_environment=vercel-preview')
  })
})
