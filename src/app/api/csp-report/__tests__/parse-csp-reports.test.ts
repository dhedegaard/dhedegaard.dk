import { describe, expect, it } from 'vitest'
import { describeBlocked, parseCspReports } from '../parse-csp-reports'

const legacyReport = {
  'csp-report': {
    'document-uri': 'https://www.dhedegaard.dk/',
    referrer: '',
    'violated-directive': 'script-src-elem',
    'effective-directive': 'script-src-elem',
    'original-policy': "default-src 'self'",
    disposition: 'report',
    'blocked-uri': 'https://evil.example/x.js',
    'status-code': 200,
    'script-sample': '',
    'source-file': 'https://www.dhedegaard.dk/',
    'line-number': 12,
    'column-number': 3,
  },
}

const reportingApiReport = {
  type: 'csp-violation',
  age: 10,
  url: 'https://www.dhedegaard.dk/',
  user_agent: 'Mozilla/5.0',
  body: {
    documentURL: 'https://www.dhedegaard.dk/',
    blockedURL: 'inline',
    effectiveDirective: 'script-src-elem',
    originalPolicy: "default-src 'self'",
    disposition: 'report',
    statusCode: 200,
    sample: 'alert(1)',
    sourceFile: 'https://www.dhedegaard.dk/',
    lineNumber: 1,
    columnNumber: 42,
  },
}

describe('parseCspReports', () => {
  it('normalizes a legacy report-uri payload', () => {
    expect(parseCspReports(legacyReport)).toEqual({
      ok: true,
      violations: [
        {
          documentUrl: 'https://www.dhedegaard.dk/',
          blockedUrl: 'https://evil.example/x.js',
          effectiveDirective: 'script-src-elem',
          disposition: 'report',
          sourceFile: 'https://www.dhedegaard.dk/',
          lineNumber: 12,
          columnNumber: 3,
          sample: '',
          statusCode: 200,
        },
      ],
    })
  })

  it('normalizes a Reporting API payload', () => {
    expect(parseCspReports([reportingApiReport])).toEqual({
      ok: true,
      violations: [
        {
          documentUrl: 'https://www.dhedegaard.dk/',
          blockedUrl: 'inline',
          effectiveDirective: 'script-src-elem',
          disposition: 'report',
          sourceFile: 'https://www.dhedegaard.dk/',
          lineNumber: 1,
          columnNumber: 42,
          sample: 'alert(1)',
          statusCode: 200,
        },
      ],
    })
  })

  it('falls back to the first token of violated-directive', () => {
    const report = {
      'csp-report': {
        'document-uri': 'https://www.dhedegaard.dk/',
        'violated-directive': "img-src 'self'",
        'blocked-uri': 'https://tracker.example/pixel.gif',
      },
    }
    const result = parseCspReports(report)
    expect(result.ok && result.violations[0]?.effectiveDirective).toBe('img-src')
  })

  it('ignores non-CSP Reporting API entries', () => {
    const deprecation = { type: 'deprecation', url: 'https://www.dhedegaard.dk/', body: {} }
    expect(parseCspReports([deprecation, reportingApiReport])).toMatchObject({
      ok: true,
      violations: [{ blockedUrl: 'inline' }],
    })
  })

  it.each(['chrome-extension', 'moz-extension', 'safari-web-extension'])(
    'drops %s noise',
    (scheme) => {
      const fromBlocked = {
        ...reportingApiReport,
        body: { ...reportingApiReport.body, blockedURL: `${scheme}://abc/inject.js` },
      }
      const fromSource = {
        ...reportingApiReport,
        body: { ...reportingApiReport.body, sourceFile: `${scheme}://abc/content.js` },
      }
      expect(parseCspReports([fromBlocked, fromSource])).toEqual({ ok: true, violations: [] })
    },
  )

  it('rejects payloads that match neither format', () => {
    expect(parseCspReports({ hello: 'world' }).ok).toBe(false)
    expect(parseCspReports('nope').ok).toBe(false)
    expect(parseCspReports(null).ok).toBe(false)
    expect(parseCspReports({ 'csp-report': { 'blocked-uri': 'x' } }).ok).toBe(false)
  })
})

describe('describeBlocked', () => {
  it('reduces network URLs to their origin', () => {
    expect(describeBlocked('https://evil.example/a/b.js?q=1')).toBe('https://evil.example')
    expect(describeBlocked('wss://ws.example/socket')).toBe('wss://ws.example')
  })

  it('reduces non-network URLs to their scheme', () => {
    expect(describeBlocked('data:image/png;base64,AAAA')).toBe('data:')
    expect(describeBlocked('blob:https://www.dhedegaard.dk/uuid')).toBe('blob:')
  })

  it('keeps keywords as-is and labels empty values', () => {
    expect(describeBlocked('inline')).toBe('inline')
    expect(describeBlocked('eval')).toBe('eval')
    expect(describeBlocked('')).toBe('unknown')
  })
})
