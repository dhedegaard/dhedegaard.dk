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

## Architecture

Personal site built with Next.js App Router, TypeScript (strictest config), Tailwind CSS v4, and daisyUI.

**Data flow:**

1. `src/clients/user-query.ts` — GraphQL document queried against the GitHub API
2. `src/clients/github.ts` — authenticated fetch + `zod/mini` parse of the raw GitHub response
3. `src/fetchers/data-action.ts` — shapes/filters the parsed response into `DataResult`, validates the final shape with `zod/mini`. This is the single source of truth for all page data.
4. `src/app/*` — server components consume `getDataAction()` directly from inside a `'use cache'` scope

**Key conventions:**

- Components are server-side by default; `'use client'` only when hooks/browser APIs are needed.
- `getDataAction()` has no `'use server'` directive — it is not a server action, just an async function called directly from server components.
- `src/codegen/types.ts` is generated — never hand-edit it. GraphQL workflow: (1) edit documents under `src/**/*.ts` (excluding `src/codegen/`), (2) run `pnpm codegen` with `GITHUB_PAT` set, (3) commit the document change and regenerated `src/codegen/types.ts` together.
- Zod schemas use `zod/mini` (not the full `zod` package) — follow existing import patterns.
- Repository sort order: pinned first, then by star count, then by `pushedAt`. This logic lives in `data-action.ts`.
- Caching lives at the route level: `page.tsx` and `sitemap.ts` open a `'use cache'` scope with `cacheLife('days')` (Next.js 16 Cache Components, enabled via `cacheComponents: true` in `next.config.ts`). `getDataAction()` itself has no `cache()` wrapper or fetch-level `revalidate` — it inherits caching from the calling scope.
- The React Compiler is enabled (`reactCompiler: true`). Write components in standard React style — the compiler handles memoization. Avoid patterns it can't optimize (conditional hook calls, etc.).
- `tagline.tsx` and `tech-stack.tsx` are fully hardcoded static content — no GitHub API involvement. Everything else on the page comes from `getDataAction()`.

**Testing conventions:**

- Tests live in `__tests__/` subdirectories alongside source files. Vitest runs with `environment: 'node'` and no globals.
- `transformGithubUserToData` (in `data-action.ts`) is the pure, sync extraction of all data-shaping logic. Test data transformations through it directly rather than mocking `fetch`.
- Use `renderToStaticMarkup` + `createElement` (from `react-dom/server`) to test server component output without a DOM environment.
- Use `vi.stubGlobal('fetch', vi.fn(...))` to mock network calls in `github.ts` tests; restore with `vi.unstubAllGlobals()` in `afterEach`.
- Test factory functions (`makeRepository`, `makeUser`) require explicit `id` fields — no auto-generated fallbacks.

## Code Style

ESLint uses `typescript-eslint` strict + `prettier` flat config. `src/codegen/` is excluded from both lint and format. `prettier-plugin-tailwindcss` is active — Tailwind class order is enforced automatically, don't reorder manually.

Sentry is wired across three runtimes via `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts`. The shared subset (DSN, `debug`, `ignoreErrors`) lives in `sentry.shared-options.ts` and is spread into each `init()` call — change it there to affect all three runtimes; only override per-runtime keys (e.g. `tracesSampleRate`, replay sampling) in the runtime file.

## Verification

Match the check to the change:

- Unit logic — `pnpm test`
- Normal code edits — `pnpm lint`
- GraphQL document changes — `pnpm codegen` (then commit generated types)
- Runtime behavior, caching, Next config, Sentry wiring, or data fetching — `pnpm build`
- If `GITHUB_PAT` is unavailable locally, state which checks were blocked.
