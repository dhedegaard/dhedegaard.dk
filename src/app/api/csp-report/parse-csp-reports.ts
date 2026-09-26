import * as z from 'zod/mini'

/** A CSP violation normalized from either report format. */
interface CspViolation {
  documentUrl: string
  blockedUrl: string
  effectiveDirective: string
  disposition: string | undefined
  sourceFile: string | undefined
  lineNumber: number | undefined
  columnNumber: number | undefined
  sample: string | undefined
  statusCode: number | undefined
}

type ParseResult = { ok: true; violations: CspViolation[] } | { ok: false; error: string }

// Legacy `report-uri` payload (`application/csp-report`).
const legacyReportSchema = z.object({
  'csp-report': z.object({
    'document-uri': z.string(),
    'blocked-uri': z.optional(z.string()),
    'effective-directive': z.optional(z.string()),
    'violated-directive': z.optional(z.string()),
    disposition: z.optional(z.string()),
    'source-file': z.optional(z.string()),
    'line-number': z.optional(z.number()),
    'column-number': z.optional(z.number()),
    'script-sample': z.optional(z.string()),
    'status-code': z.optional(z.number()),
  }),
})

// Reporting API payload (`application/reports+json`) — a batch of typed reports.
const reportingApiSchema = z.array(z.object({ type: z.string(), body: z.unknown() }))

const cspViolationBodySchema = z.object({
  documentURL: z.string(),
  blockedURL: z.optional(z.nullable(z.string())),
  effectiveDirective: z.string(),
  disposition: z.optional(z.string()),
  sourceFile: z.optional(z.nullable(z.string())),
  lineNumber: z.optional(z.nullable(z.number())),
  columnNumber: z.optional(z.nullable(z.number())),
  sample: z.optional(z.nullable(z.string())),
  statusCode: z.optional(z.number()),
})

// Violations caused by browser extensions, not by the site.
const EXTENSION_SCHEMES = [
  'chrome-extension:',
  'moz-extension:',
  'safari-extension:',
  'safari-web-extension:',
  'ms-browser-extension:',
]

const isExtensionNoise = ({ blockedUrl, sourceFile }: CspViolation): boolean =>
  [blockedUrl, sourceFile ?? ''].some((url) =>
    EXTENSION_SCHEMES.some((scheme) => url.startsWith(scheme)),
  )

function parseLegacy(report: z.infer<typeof legacyReportSchema>): CspViolation | undefined {
  const r = report['csp-report']
  // Older browsers only send violated-directive, which may include the source list.
  const directive = r['effective-directive'] ?? r['violated-directive']?.split(' ')[0]
  if (!directive) return undefined
  return {
    documentUrl: r['document-uri'],
    blockedUrl: r['blocked-uri'] ?? '',
    effectiveDirective: directive,
    disposition: r.disposition,
    sourceFile: r['source-file'],
    lineNumber: r['line-number'],
    columnNumber: r['column-number'],
    sample: r['script-sample'],
    statusCode: r['status-code'],
  }
}

function parseReportingApi(
  reports: z.infer<typeof reportingApiSchema>,
): CspViolation[] | undefined {
  const violations: CspViolation[] = []
  for (const report of reports) {
    if (report.type !== 'csp-violation') continue
    const body = cspViolationBodySchema.safeParse(report.body)
    if (!body.success) return undefined
    const b = body.data
    violations.push({
      documentUrl: b.documentURL,
      blockedUrl: b.blockedURL ?? '',
      effectiveDirective: b.effectiveDirective,
      disposition: b.disposition,
      sourceFile: b.sourceFile ?? undefined,
      lineNumber: b.lineNumber ?? undefined,
      columnNumber: b.columnNumber ?? undefined,
      sample: b.sample ?? undefined,
      statusCode: b.statusCode,
    })
  }
  return violations
}

/** Parses a CSP report body (either format), dropping browser-extension noise. */
export function parseCspReports(payload: unknown): ParseResult {
  const legacy = legacyReportSchema.safeParse(payload)
  const reportingApi = reportingApiSchema.safeParse(payload)

  let violations: CspViolation[] | undefined
  if (legacy.success) {
    const violation = parseLegacy(legacy.data)
    violations = violation ? [violation] : undefined
  } else if (reportingApi.success) {
    violations = parseReportingApi(reportingApi.data)
  }

  if (!violations) return { ok: false, error: 'Unrecognized CSP report payload' }
  return { ok: true, violations: violations.filter((v) => !isExtensionNoise(v)) }
}

/**
 * Stable, low-cardinality label for what was blocked: the origin for network
 * URLs, the scheme for others (`data:`), or the keyword (`inline`, `eval`).
 */
export function describeBlocked(blockedUrl: string): string {
  if (!blockedUrl) return 'unknown'
  if (!URL.canParse(blockedUrl)) return blockedUrl
  const url = new URL(blockedUrl)
  return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) ? url.origin : url.protocol
}
