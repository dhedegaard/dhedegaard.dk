---
paths:
  - "sentry.*.ts"
  - "src/instrumentation.ts"
  - "instrumentation-client.ts"
  - "next.config.ts"
  - "src/app/avatar.tsx"
---

# Sentry and the client bundle

Sentry is wired across three runtimes via `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts`. The shared subset (DSN, `debug`, `ignoreErrors`) lives in `sentry.shared-options.ts`, type-checked with `satisfies`, and is spread into each `init()` call — change it there to affect all three runtimes. `dataCollection` is left at Sentry 11's defaults on purpose: most of its categories never occur on a static site. Sentry 11 names the Vercel environments `production`/`preview` (no `vercel-` prefix), and `cspHeaders()` sends the same names. No runtime file overrides anything today; per-runtime keys (e.g. `tracesSampleRate`) would go in that runtime's file.

**Client bundle (audited 2026-10-29) — do not re-litigate.** What ships is the Next/React runtime, Sentry, the accepted `zod/mini` codec, and `next/image` for the avatar (about 7.7 KB). Nothing else is worth cutting:

- `next/image`: swapping the avatar to `getImageProps()` would drop it, but loses the automatic `priority` preload on the likely LCP image, so it was skipped.
- Sentry is the largest client chunk (~127 KB gzip) and loads eagerly via `instrumentation-client.ts`, already at Sentry's recommended minimum. The only lever Sentry recommends is tree-shaking (don't import unused integrations), and `init()` adds no integrations, so Session Replay, Browser Tracing, and Profiling are all excluded (verified: no replay/rrweb code ships).
- `bundleSizeOptimizations` (`excludeTracing`, `excludeDebugStatements`) are set in `next.config.ts` but are **no-ops under Turbopack** (our build) — Sentry's tree-shaking transforms only run on webpack. Keep them anyway so they activate automatically if Turbopack tree-shaking lands later; revisit this chunk after Next/Sentry upgrades.
- Do **not** suggest lazy-loading or deferring the core SDK `init()` to cut the bundle. Sentry recommends lazy-loading only for Session Replay (unused here), and deferring core init sacrifices early-error capture for a page that already paints instantly as static HTML.
