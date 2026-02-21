# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

- App: personal site built with Next.js App Router (`src/app`), TypeScript, Tailwind CSS v4, and daisyUI.
- Runtime model: server-first React components; use client components only when needed (`'use client'`).
- Data source: GitHub GraphQL API via `src/clients/github.ts`.
- Validation: runtime validation and parsing via `zod` (see `src/fetchers/data-action.ts`).
- Monitoring: Sentry for client/server/edge runtimes.

## Environment Requirements

- Node version: `24` (see `package.json` engines).
- Required env var: `GITHUB_PAT` for:
  - runtime GitHub fetching (`src/clients/github.ts`)
  - GraphQL codegen (`codegen.yml`)
- Sentry env (when relevant): `NEXT_PUBLIC_SENTRY_DSN`.

## Common Commands

- Install deps: `npm ci` (CI) or `npm install`.
- Dev server: `npm run dev` (Turbopack).
- Lint: `npm run lint`.
- Build: `npm run build` (also runs lint via `concurrently`).
- Generate GraphQL types: `npm run codegen` (requires `GITHUB_PAT`).

## Architecture Map

- `src/app/*`: route components, layouts, error/loading/not-found boundaries.
- `src/fetchers/data-action.ts`: canonical server data shaping, caching, and `zod` validation.
- `src/clients/github.ts`: authenticated GitHub GraphQL fetch with revalidation.
- `src/clients/user-query.ts`: GraphQL document used by runtime fetch/codegen.
- `src/codegen/types.ts`: generated GraphQL types (do not hand-edit).
- `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`: Sentry wiring.

## Conventions To Follow

- Keep components server-side by default; add `'use client'` only when hooks/browser APIs demand it.
- Validate external API data before use; follow existing `zod` parsing patterns.
- Preserve caching semantics:
  - React `cache(...)` for deduping server calls.
  - `unstable_cache(...)`/`fetch(..., { next: { revalidate } })` for revalidation behavior.
- Keep TypeScript strictness intact (project extends `@tsconfig/strictest`).
- Prefer small, local, typed helpers over broad utility abstractions.

## GraphQL Workflow

1. Update/add GraphQL documents under `src/**/*.ts` (excluding `src/codegen/**`).
2. Run `npm run codegen`.
3. Commit document and regenerated `src/codegen/types.ts` together.
4. Ensure runtime code uses generated types from `src/codegen/types.ts`.

## Editing Guardrails

- Do not commit secrets from `.env`.
- Do not hand-edit generated artifacts in `src/codegen/types.ts`; regenerate instead.
- Keep lint clean with `npm run lint`.
- Prefer changes that pass `npm run build` to mirror CI.

## Verification Checklist (Before Finishing)

- `npm run lint` passes.
- If GraphQL changed: `npm run codegen` run and generated types updated.
- If runtime behavior changed: `npm run build` passes.
- Confirm `GITHUB_PAT`-dependent paths were considered when touching data fetch/codegen.
