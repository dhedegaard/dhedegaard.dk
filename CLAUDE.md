# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server with Turbopack
- `npm run build` — production build (also runs lint via `concurrently`)
- `npm run lint` — ESLint only
- `npm test` — Vitest test suite (`vitest run`)
- `npm test -- src/path/to/file.test.ts` — run a single test file
- `npm run codegen` — regenerate GraphQL types from GitHub API (requires `GITHUB_PAT` env var)

`npm run build` is the primary correctness check; `npm test` covers unit logic.

## Environment

- Node 24 required
- `GITHUB_PAT` — required for runtime data fetching and for `npm run codegen`
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry (optional locally)

## Architecture

Personal site built with Next.js App Router, TypeScript (strictest config), Tailwind CSS v4, and daisyUI.

**Data flow:**

1. `src/clients/user-query.ts` — GraphQL document queried against the GitHub API
2. `src/clients/github.ts` — authenticated fetch with `next: { revalidate: 3600 }` ISR caching
3. `src/fetchers/data-action.ts` — shapes/filters raw GitHub data, validates with `zod/mini`, dedupes with React `cache()`. This is the single source of truth for all page data.
4. `src/app/*` — server components consume `getDataAction()` directly

**Key conventions:**

- Components are server-side by default; `'use client'` only when hooks/browser APIs are needed.
- `getDataAction()` has no `'use server'` directive — it is not a server action, just an async function called directly from server components.
- `src/codegen/types.ts` is generated — never hand-edit it. After modifying GraphQL documents in `src/**/*.ts`, run `npm run codegen` and commit both files together.
- Zod schemas use `zod/mini` (not the full `zod` package) — follow existing import patterns.
- Repository sort order: pinned first, then by star count, then by `pushedAt`. This logic lives in `data-action.ts`.
- Caching has two layers: React `cache()` for per-request deduping, and `'use cache'` + `cacheLife()` (Next.js 16 Cache Components, enabled via `cacheComponents: true` in `next.config.ts`) for ISR. Don't collapse these layers.
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

Sentry is wired across three runtimes via `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts`.
