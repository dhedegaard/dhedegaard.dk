import { captureMessage, flush } from '@sentry/nextjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../route'

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  flush: vi.fn(() => Promise.resolve(true)),
}))

const violationBody = (blockedURL: string) => ({
  documentURL: 'https://www.dhedegaard.dk/',
  blockedURL,
  effectiveDirective: 'script-src-elem',
  disposition: 'report',
})

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(
    new Request('https://www.dhedegaard.dk/api/csp-report', {
      method: 'POST',
      headers: { 'content-type': 'application/reports+json', ...headers },
      body,
    }),
  )

describe('POST /api/csp-report', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs a violation to Sentry as a warning', async () => {
    const res = await post(
      JSON.stringify([
        { type: 'csp-violation', body: violationBody('https://evil.example/a.js') },
      ]),
    )

    expect(res.status).toBe(204)
    expect(captureMessage).toHaveBeenCalledOnce()
    const [message, context] = vi.mocked(captureMessage).mock.calls[0] ?? []
    expect(message).toBe('CSP violation: script-src-elem blocked https://evil.example')
    expect(context).toMatchObject({
      level: 'warning',
      fingerprint: ['csp', 'script-src-elem', 'https://evil.example'],
      tags: {
        'csp.directive': 'script-src-elem',
        'csp.blocked': 'https://evil.example',
        'csp.disposition': 'report',
      },
      contexts: { csp: { blockedUrl: 'https://evil.example/a.js' } },
    })
    expect(flush).toHaveBeenCalledOnce()
  })

  it('accepts the legacy report-uri format', async () => {
    const res = await post(
      JSON.stringify({
        'csp-report': {
          'document-uri': 'https://www.dhedegaard.dk/',
          'effective-directive': 'img-src',
          'blocked-uri': 'https://tracker.example/pixel.gif',
        },
      }),
      { 'content-type': 'application/csp-report' },
    )

    expect(res.status).toBe(204)
    expect(captureMessage).toHaveBeenCalledWith(
      'CSP violation: img-src blocked https://tracker.example',
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('logs each distinct violation in a batch once', async () => {
    const res = await post(
      JSON.stringify([
        { type: 'csp-violation', body: violationBody('https://evil.example/a.js') },
        { type: 'csp-violation', body: violationBody('https://evil.example/b.js') },
        { type: 'csp-violation', body: violationBody('inline') },
      ]),
    )

    expect(res.status).toBe(204)
    expect(captureMessage).toHaveBeenCalledTimes(2)
  })

  it('accepts extension-only noise without logging', async () => {
    const res = await post(
      JSON.stringify([
        { type: 'csp-violation', body: violationBody('chrome-extension://abc/x.js') },
      ]),
    )

    expect(res.status).toBe(204)
    expect(captureMessage).not.toHaveBeenCalled()
    expect(flush).not.toHaveBeenCalled()
  })

  it('rejects invalid JSON', async () => {
    const res = await post('{not json')
    expect(res.status).toBe(400)
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('rejects unrecognized payloads', async () => {
    const res = await post(JSON.stringify({ hello: 'world' }))
    expect(res.status).toBe(400)
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('rejects oversized bodies', async () => {
    const res = await post(JSON.stringify([{ type: 'x', body: 'a'.repeat(70_000) }]))
    expect(res.status).toBe(413)
    expect(captureMessage).not.toHaveBeenCalled()
  })
})
