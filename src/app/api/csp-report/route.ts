import { captureMessage, flush } from '@sentry/nextjs'
import { describeBlocked, parseCspReports } from './parse-csp-reports'

// Real reports are a few KB; cap to limit abuse of this public endpoint.
const MAX_BODY_BYTES = 64 * 1024

const status = (code: number) => new Response(null, { status: code })

/** Receives CSP violation reports and logs them to Sentry as warnings. */
export async function POST(request: Request): Promise<Response> {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return status(413)
  const buffer = await request.arrayBuffer()
  if (buffer.byteLength > MAX_BODY_BYTES) return status(413)

  let payload: unknown
  try {
    payload = JSON.parse(new TextDecoder().decode(buffer))
  } catch {
    return status(400)
  }

  const result = parseCspReports(payload)
  if (!result.ok) return status(400)

  // One event per distinct violation in a batch; Sentry groups across requests.
  const seen = new Set<string>()
  for (const violation of result.violations) {
    const blocked = describeBlocked(violation.blockedUrl)
    const key = `${violation.effectiveDirective} ${blocked}`
    if (seen.has(key)) continue
    seen.add(key)

    captureMessage(`CSP violation: ${violation.effectiveDirective} blocked ${blocked}`, {
      level: 'warning',
      fingerprint: ['csp', violation.effectiveDirective, blocked],
      tags: {
        'csp.directive': violation.effectiveDirective,
        'csp.blocked': blocked,
        'csp.disposition': violation.disposition ?? 'unknown',
      },
      contexts: { csp: { ...violation } },
    })
  }

  // Flush before responding so the serverless instance can't freeze mid-send.
  if (seen.size > 0) await flush(2000)
  return status(204)
}
