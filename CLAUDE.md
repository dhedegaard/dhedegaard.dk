# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server with Turbopack
- `npm run build` — production build (also runs lint via `concurrently`)
- `npm run lint` — ESLint only
- `npm run codegen` — regenerate GraphQL types from GitHub API (requires `GITHUB_PAT` env var)

No test suite exists; `npm run build` is the primary correctness check.

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
- `src/codegen/types.ts` is generated — never hand-edit it. After modifying GraphQL documents in `src/**/*.ts`, run `npm run codegen` and commit both files together.
- Zod schemas use `zod/mini` (not the full `zod` package) — follow existing import patterns.
- Repository sort order: pinned first (by pin position), then by star count, then by `pushedAt`. This logic lives in `data-action.ts`.

## Code Style

ESLint uses `typescript-eslint` strict + `prettier` flat config. Formatter (via `biome.json`): single quotes, no semicolons, 2-space indent, 100-char line width. `src/codegen/` is excluded from both lint and format.
