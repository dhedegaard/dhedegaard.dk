# Copilot / AI agent instructions for dhedegaard.dk

Quick, actionable guidance to help an AI coding agent be productive here.

## Project summary ✅

- Next.js 16 App Router (server-first by default). Pages in `src/app/` use server components; client components are opt-in with `"use client"`.
- GraphQL: GitHub GraphQL is queried at runtime (see `src/clients/github.ts`) and types generated into `src/codegen/types.ts` via `graphql-codegen` (`npm run codegen`).
- Sentry is configured for client, server and edge runtimes (see `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`, and `src/instrumentation.ts`).
- Uses TypeScript + Tailwind CSS + daisyUI. Strict TS config (`@tsconfig/strictest`).

## Key commands (run from repo root) 🔧

- Start dev server: `npm run dev` (uses `next dev --turbopack`).
- Build: `npm run build` (used by CI).
- Lint: `npm run lint` (runs `eslint src`).
- Generate GraphQL types: `npm run codegen` (requires `GITHUB_PAT` to be set).

## CI notes ⚠️

- CI workflow `.github/workflows/ci.yml` runs `npm ci`, `npm run build` and `npm run lint` on push.
- CI sets `GITHUB_PAT` from `secrets._GITHUB_PAT` for the build step (used by codegen/fetches).

## Environment & secrets 🔑

- GITHUB_PAT: required by `src/clients/github.ts` (throws if missing) and required by `npm run codegen` (see `codegen.yml`).
- NEXT_PUBLIC_SENTRY_DSN: used by Sentry configs (client/server/edge).
- Node engine: 24 (see `package.json`).

## Important code patterns & conventions 💡

- Server-first data fetching:
  - `src/fetchers/data-action.ts` is a server action (`'use server'`) that calls `getGithubUser()` and uses `zod` for runtime validation.
  - Use `cache` from `react` or `unstable_cache` from `next/cache` for memoization and revalidation patterns (see `src/app/page.tsx`).
- GraphQL documents live near code (e.g., `src/clients/user-query.ts`). Codegen reads `src/**/*.ts` and writes `src/codegen/types.ts`.
- Sentry initialization is runtime-dependent: `src/instrumentation.ts` conditionally imports `sentry.server.config` or `sentry.edge.config` based on `NEXT_RUNTIME`.
- Error handling:
  - Client-side global error component captures to Sentry (`src/app/global-error.tsx`).
  - Server fetches throw and Zod is used to validate / parse responses.

## When editing or adding features 🔍

- If you add GraphQL queries/mutations, update documents under `src/` and run `npm run codegen` with `GITHUB_PAT` set.
- If you add server code that may run on the edge, ensure imports are ESM/edge-compatible and check `sentry.edge.config.ts` if instrumentation is required.
- Prefer runtime validation with `zod` (as shown in `src/fetchers/data-action.ts`) for external data (GitHub responses).
- Use `next` fetch `next: { revalidate: ... }` when you want ISR behavior in fetch calls (see `src/clients/github.ts`).

## Files to inspect first when making changes 📁

- `src/app/*` — UI and route entry points
- `src/fetchers/data-action.ts` — canonical example of server data flow and zod parsing
- `src/clients/github.ts` & `src/clients/user-query.ts` — how external API calls are made and authenticated
- `codegen.yml` & `src/codegen/types.ts` — GraphQL codegen configuration and output
- `sentry.*.config.ts`, `src/instrumentation.ts` — Sentry setup (client/server/edge)

## Gotchas & quick checks ✅

- Missing `GITHUB_PAT` causes runtime errors while fetching GitHub data and fails codegen — CI injects a secret but local dev must set it.
- No test suite present — rely on linting and local verification during changes.
- Dev uses Turbopack by default (`npm run dev`) — if debugging build issues, try `npm run build` locally to mimic CI.

---

If anything above is unclear or you want more details (examples of typical PR changes, suggested tests, or a short checklist for PR reviewers), tell me which area to expand and I will iterate. 👋
