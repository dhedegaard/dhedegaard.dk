# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

- App: personal site built with Next.js 16 App Router (`src/app`), React 19, TypeScript, Tailwind CSS v4, and daisyUI.
- Runtime model: server-first React components. Add `'use client'` only when hooks, browser APIs, or client-only error boundaries require it.
- Data source: GitHub GraphQL API via `src/clients/github.ts` and the query in `src/clients/user-query.ts`.
- Data shaping: `src/fetchers/data-action.ts` is the canonical place for filtering, sorting, normalizing, and validating GitHub data.
- Monitoring: Sentry is wired for client, server, and edge runtimes.

## Environment Requirements

- Node version: `24` (see `package.json` `engines`).
- Required env var: `GITHUB_PAT` for local runtime GitHub fetching and `npm run codegen`.
- Optional local env var: `NEXT_PUBLIC_SENTRY_DSN` for Sentry client reporting.
- Do not commit secrets from `.env` or shell history.

## Common Commands

- Install deps: `npm ci` for a lockfile-faithful install, or `npm install` while intentionally updating dependencies.
- Dev server: `npm run dev`.
- Lint: `npm run lint` (`eslint src`).
- Build: `npm run build` (runs `next build` and lint concurrently; this is the CI check).
- Generate GraphQL types: `npm run codegen` (requires `GITHUB_PAT`).

There is no test suite at the moment. Use lint plus build as the primary verification path.

## Architecture Map

- `src/app/*`: route components, layout, loading/error/not-found boundaries, sitemap, and page-level UI.
- `src/app/page.tsx`: main route; uses Next Cache Components with `'use cache'` and `cacheLife('days')`.
- `src/fetchers/data-action.ts`: server action, Sentry error capture, `zod/mini` validation, public-repo filtering, pinned/star/pushed ordering, and final `DataResult` shape.
- `src/clients/github.ts`: authenticated GitHub GraphQL POST using generated `UserQueryQuery` types.
- `src/clients/user-query.ts`: GraphQL document consumed by runtime code and GraphQL Code Generator.
- `src/codegen/types.ts`: generated GraphQL types. Do not hand-edit.
- `src/styles/globals.css`: Tailwind v4 import and daisyUI light theme setup.
- `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`: Sentry wiring.
- `.github/workflows/ci.yml`: CI runs `npm ci` and `npm run build` on push with `GITHUB_PAT` from `secrets._GITHUB_PAT`.

## Conventions To Follow

- Keep components server-side by default. Use client components only for required client behavior.
- Keep TypeScript strictness intact; the project extends `@tsconfig/strictest`.
- Follow the existing `zod/mini` import and schema style when validating external data.
- Preserve the current repository ordering behavior: pinned repositories in pinned order, then by stargazer count, then by newest `pushedAt`.
- Preserve Next Cache Components semantics around cached pages. If changing data freshness, update the relevant `cacheLife(...)` or fetch/cache strategy intentionally.
- The React Compiler is enabled (`reactCompiler: true`). Write normal React; avoid patterns the compiler cannot reason about, such as conditional hooks.
- Prefer small, local, typed helpers over broad utility abstractions.
- Let Prettier and `prettier-plugin-tailwindcss` handle formatting and Tailwind class order.

## GraphQL Workflow

1. Update GraphQL documents under `src/**/*.ts` (excluding `src/codegen/**`).
2. Run `npm run codegen` with `GITHUB_PAT` available.
3. Commit the document change and regenerated `src/codegen/types.ts` together.
4. Ensure runtime code imports generated types from `src/codegen/types.ts`.

## Editing Guardrails

- Do not hand-edit generated artifacts in `src/codegen/types.ts`; regenerate them.
- Keep `src/fetchers/data-action.ts` as the single source of truth for GitHub-derived page data.
- `tagline.tsx` and `tech-stack.tsx` are static content; do not route them through the GitHub data path unless the product behavior is intentionally changing.
- When adding external data, validate it before rendering and decide where it belongs in the `DataResult` shape.
- When changing Sentry configuration, consider all three runtimes: client, server, and edge.

## Verification Checklist

- Run `npm run lint` for normal code changes.
- Run `npm run codegen` if any GraphQL document changed.
- Run `npm run build` if runtime behavior, caching, Next config, Sentry wiring, or data fetching changed.
- If `GITHUB_PAT` is unavailable locally, say which checks were blocked and why.
