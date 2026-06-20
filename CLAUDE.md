# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm install --frozen-lockfile` — lockfile-faithful install; use `pnpm install` only when intentionally updating deps
- `pnpm dev` — dev server with Turbopack
- `pnpm build` — production build (runs `next build` and lint concurrently; this is the CI check)
- `pnpm lint` — ESLint only
- `pnpm test` — Vitest test suite (`vitest run`)
- `pnpm test src/path/to/file.test.ts` — run a single test file
- `pnpm codegen` — regenerate GraphQL types from GitHub API (requires `GITHUB_PAT` env var)

`pnpm build` is the primary correctness check; `pnpm test` covers unit logic. CI (`.github/workflows/ci.yml`) runs `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm build` on push with `GITHUB_PAT` injected.

## Environment

- Node 24 required
- `GITHUB_PAT` — required for runtime data fetching and for `pnpm codegen`
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry (optional locally)
- `SITE_URL` — overrides the canonical origin used for absolute URLs/metadata (optional; defaults to the production domain — see `src/site.ts`)

## Architecture

Personal site built with Next.js App Router, TypeScript (strictest config), and Tailwind CSS v4. Styling is plain Tailwind utility classes (no component library); `lucide-react` provides icons.

**Data flow:**

1. `src/clients/user-query.ts` — GraphQL document queried against the GitHub API
2. `src/clients/github.ts` — authenticated fetch + `zod/mini` parse of the raw GitHub response
3. `src/fetchers/data-action.ts` — shapes/filters the parsed response into `DataResult`, validates the final shape with `zod/mini`. This is the single source of truth for all page data.
4. `src/app/*` — server components consume `getDataAction()` directly from inside a `'use cache'` scope

**Key conventions:**

- Components are server-side by default; `'use client'` only when hooks/browser APIs are needed.
- `getDataAction()` has no `'use server'` directive — it is not a server action, just an async function called directly from server components.
- `src/codegen/types.ts` is generated — never hand-edit it. GraphQL workflow: (1) edit documents under `src/**/*.ts` (excluding `src/codegen/`), (2) run `pnpm codegen` with `GITHUB_PAT` set, (3) commit the document change and regenerated `src/codegen/types.ts` together.
- Zod schemas import from `zod/mini` (the tree-shakeable subset of the `zod` v4 package, also listed in `optimizePackageImports`) — never import from `zod` directly; follow existing patterns.
- `src/site.ts` exports `SITE_URL`, the canonical origin (no trailing slash, overridable via the `SITE_URL` env var for preview deploys). It is the single source for absolute URLs — `layout.tsx` metadata, `robots.ts`, and `sitemap.ts` all read it rather than hardcoding the domain.
- Repository sort order: pinned first, then by star count, then by `pushedAt`. This logic lives in `data-action.ts`.
- Caching lives at the route level: `page.tsx` and `sitemap.ts` open a `'use cache'` scope with `cacheLife('days')` (Next.js 16 Cache Components, enabled via `cacheComponents: true` in `next.config.ts`). `getDataAction()` itself has no `cache()` wrapper or fetch-level `revalidate` — it inherits caching from the calling scope.
- The React Compiler is enabled (`reactCompiler: true`). Write components in standard React style — the compiler handles memoization. Avoid patterns it can't optimize (conditional hook calls, etc.).
- `tagline.tsx` and `tech-stack.tsx` are fully hardcoded static content — no GitHub API involvement. Everything else on the page comes from `getDataAction()`.
- Security headers live in `next.config.ts` `headers()` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`). We deliberately do **not** ship a Content-Security-Policy: the App Router emits inline RSC-payload scripts, so a CSP would need either `script-src 'unsafe-inline'` (weak, little real protection) or a per-request nonce (which forces dynamic rendering and breaks the `'use cache'` static model), and the third-party origin list is easy to get subtly wrong. For a static site with no user-generated content the maintenance risk outweighs the benefit — don't add a CSP without a deliberate decision to take that on.

**Testing conventions:**

- Tests live in `__tests__/` subdirectories alongside source files. Vitest runs with `environment: 'node'` and no globals (config in `vitest.config.ts`).
- The test toolchain has a non-obvious dependency: `vitest.config.ts` uses `@vitejs/plugin-react` to transform JSX in `.tsx` test files, and `vite` is a required (non-optional) peer of vitest 4 — so both `vite` and `@vitejs/plugin-react` must stay explicit `devDependencies`. If `vite` drops out of the tree (e.g. a lockfile regen), a clean `pnpm install --frozen-lockfile` leaves vitest unable to import it and `pnpm test` fails at startup with `ERR_MODULE_NOT_FOUND` — even though it may still pass locally on a stale `node_modules`.
- `transformGithubUserToData` (in `data-action.ts`) is the pure, sync extraction of all data-shaping logic. Test data transformations through it directly rather than mocking `fetch`.
- Use `renderToStaticMarkup` + `createElement` (from `react-dom/server`) to test server component output without a DOM environment.
- Use `vi.stubGlobal('fetch', vi.fn(...))` to mock network calls in `github.ts` tests; restore with `vi.unstubAllGlobals()` in `afterEach`.
- Test factory functions (`makeRepository`, `makeUser`) require explicit `id` fields — no auto-generated fallbacks.

## Code Style

ESLint uses `typescript-eslint` strict + `prettier` flat config. `src/codegen/` is excluded from both lint and format. `prettier-plugin-tailwindcss` is active — Tailwind class order is enforced automatically, don't reorder manually.

Sentry is wired across three runtimes via `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts`. The shared subset (DSN, `debug`, `ignoreErrors`) lives in `sentry.shared-options.ts` and is spread into each `init()` call — change it there to affect all three runtimes; only override per-runtime keys (e.g. `tracesSampleRate`, replay sampling) in the runtime file.

**Sentry client bundle — do not re-litigate.** The Sentry browser SDK is the largest client chunk (~127 KB gzip) and loads eagerly via `instrumentation-client.ts`. This is already at Sentry's recommended minimum and should be left as-is:

- The only lever Sentry recommends is tree-shaking (don't import unused integrations). We already do this — `init()` adds no integrations, so Session Replay, Browser Tracing, and Profiling are all excluded (verified: no replay/rrweb code ships).
- `bundleSizeOptimizations` (`excludeTracing`, `excludeDebugStatements`) are set in `next.config.ts` but are **no-ops under Turbopack** (our build) — Sentry's tree-shaking transforms only run on webpack. Keep them anyway so they activate automatically if Turbopack tree-shaking lands later; revisit this chunk after Next/Sentry upgrades.
- Do **not** suggest lazy-loading or deferring the core SDK `init()` to cut the bundle. Sentry recommends lazy-loading only for Session Replay (unused here), and deferring core init sacrifices early-error capture for a page that already paints instantly as static HTML. Not worth it.

## Verification

Match the check to the change:

- Unit logic — `pnpm test`
- Normal code edits — `pnpm lint`
- GraphQL document changes — `pnpm codegen` (then commit generated types)
- Runtime behavior, caching, Next config, Sentry wiring, or data fetching — `pnpm build`
- If `GITHUB_PAT` is unavailable locally, state which checks were blocked.
