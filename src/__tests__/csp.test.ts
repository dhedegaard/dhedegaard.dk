import { describe, expect, it } from 'vitest'
import { buildCsp, CSP_REPORT_GROUP, CSP_REPORT_PATH, sentryIngestOrigin } from '../csp'

const DSN = 'https://abc123@o42.ingest.de.sentry.io/1337'

const directives = (csp: string): Map<string, string[]> =>
  new Map(
    csp.split('; ').map((directive) => {
      const [name = '', ...values] = directive.split(' ')
      return [name, values]
    }),
  )

describe('sentryIngestOrigin', () => {
  it('returns the ingest origin without the public key', () => {
    expect(sentryIngestOrigin(DSN)).toBe('https://o42.ingest.de.sentry.io')
  })

  it('returns undefined for a missing or malformed DSN', () => {
    expect(sentryIngestOrigin(undefined)).toBeUndefined()
    expect(sentryIngestOrigin('')).toBeUndefined()
    expect(sentryIngestOrigin('not a url')).toBeUndefined()
  })
})

describe('buildCsp', () => {
  it('builds the production policy', () => {
    const csp = directives(buildCsp({ isDev: false, isPreview: false, sentryDsn: DSN }))

    expect(csp.get('default-src')).toEqual(["'self'"])
    expect(csp.get('script-src')).toEqual(["'self'", "'unsafe-inline'"])
    expect(csp.get('style-src')).toEqual(["'self'", "'unsafe-inline'"])
    expect(csp.get('img-src')).toEqual(["'self'", 'data:', 'blob:', 'https://gravatar.com'])
    expect(csp.get('font-src')).toEqual(["'self'"])
    expect(csp.get('connect-src')).toEqual(["'self'", 'https://o42.ingest.de.sentry.io'])
    expect(csp.get('object-src')).toEqual(["'none'"])
    expect(csp.get('base-uri')).toEqual(["'self'"])
    expect(csp.get('form-action')).toEqual(["'self'"])
    expect(csp.get('frame-ancestors')).toEqual(["'none'"])
    expect(csp.get('report-uri')).toEqual([CSP_REPORT_PATH])
    expect(csp.get('report-to')).toEqual([CSP_REPORT_GROUP])
    expect(csp.has('frame-src')).toBe(false)
  })

  it('omits the Sentry origin when no DSN is configured', () => {
    const csp = directives(buildCsp({ isDev: false, isPreview: false, sentryDsn: undefined }))
    expect(csp.get('connect-src')).toEqual(["'self'"])
  })

  it("adds 'unsafe-eval' in development only", () => {
    const dev = directives(buildCsp({ isDev: true, isPreview: false, sentryDsn: DSN }))
    expect(dev.get('script-src')).toContain("'unsafe-eval'")

    const prod = directives(buildCsp({ isDev: false, isPreview: false, sentryDsn: DSN }))
    expect(prod.get('script-src')).not.toContain("'unsafe-eval'")
  })

  it('allows the Vercel toolbar on preview deployments', () => {
    const csp = directives(buildCsp({ isDev: false, isPreview: true, sentryDsn: DSN }))

    expect(csp.get('script-src')).toContain('https://vercel.live')
    expect(csp.get('connect-src')).toEqual(
      expect.arrayContaining(['https://vercel.live', 'wss://ws-us3.pusher.com']),
    )
    expect(csp.get('img-src')).toEqual(
      expect.arrayContaining(['https://vercel.live', 'https://vercel.com']),
    )
    expect(csp.get('style-src')).toContain('https://vercel.live')
    expect(csp.get('font-src')).toEqual(
      expect.arrayContaining(['https://vercel.live', 'https://assets.vercel.com']),
    )
    expect(csp.get('frame-src')).toEqual(["'self'", 'https://vercel.live'])
  })
})
