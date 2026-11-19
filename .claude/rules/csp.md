---
paths:
  - "src/csp.ts"
  - "src/__tests__/csp.test.ts"
  - "next.config.ts"
  - "src/app/layout.tsx"
  - "instrumentation-client.ts"
  - "sentry.*.ts"
---

# Security headers and CSP

Security headers live in `next.config.ts` `headers()` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, CSP). The CSP comes from `cspHeaders()` in `src/csp.ts`:

- It is **enforced** (`Content-Security-Policy`, after a report-only rollout). Emergency rollback: rename the header in `cspHeaders()` back to `Content-Security-Policy-Report-Only`.
- **The site must stay statically prerendered — no proxy/middleware for CSP** — which rules out nonces, so `script-src` uses `'unsafe-inline'` (experimental SRI doesn't cover inline RSC-payload scripts). Previews also allow the Vercel toolbar; dev adds `'unsafe-eval'`. `upgrade-insecure-requests` is omitted in dev because Safari upgrades `http://localhost` too (a local `next start` in Safari will still break on it).
- **Keep the CSP in sync with the site:** any change that adds, removes, or moves a script, stylesheet, image/font host, fetch/websocket target, iframe, or third-party integration (analytics, Sentry, embeds) must update `cspHeaders()` and `src/__tests__/csp.test.ts` in the same change — and drop origins that are no longer used.
- Reporting goes straight to Sentry's security endpoint (derived from `NEXT_PUBLIC_SENTRY_DSN`; no DSN → no reporting). Sentry ingests these as `csp` events at `error` level (accepted) and filters extension noise under Project Settings → Security Headers, where "Additional ignored sources" also drops blocked `eval` (bots and extensions; the site never uses eval in production). CSP reports bypass the SDK, so `beforeSend`/`ignoreErrors` can't filter them. A real `csp` event means something was **blocked**.
- The `sentry_key` in the report URI is the public DSN key (already shipped in the client bundle) — exposing it is fine. No same-origin Sentry tunnel/proxy: losing reports from visitors whose ad blockers block `*.sentry.io` is an accepted risk.
