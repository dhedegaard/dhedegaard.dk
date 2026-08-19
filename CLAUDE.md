# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm ci` — lockfile-faithful install; use `npm install` only when intentionally updating deps
- `npm run dev` — dev server with Turbopack
- `npm run build` — production build (runs `next build` and lint concurrently; this is the CI check)
- `npm run lint` — ESLint only
- `npm test` — Vitest test suite (`vitest run`)
- `npm test -- src/path/to/file.test.ts` — run a single test file
- `npm run knip` — detect unused exports, deps, and files (zero-config; hard CI gate)
- `npm run codegen` — regenerate GraphQL types from GitHub API (requires `GITHUB_PAT` env var)

`npm run build` is the primary correctness check; `npm test` covers unit logic. CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm test`, `npm run build` (with `GITHUB_PAT` injected), then `npm run knip` on push — all four are hard gates, so a green local build alone does not mean green CI. knip runs _after_ the build on purpose: it needs the generated `src/graphql-env.d.ts` that `graphql.ts` imports, so running it on a fresh clone before `npm run codegen` fails on an unresolvable import. knip itself needs no `GITHUB_PAT`.

Packages with install scripts must be allowlisted in `package.json` `allowScripts` (npm's script gate) — when an install warns about uncovered install scripts, run `npm approve-scripts <pkg>` after confirming the package is trusted. Note: the migration from pnpm dropped pnpm's minimum-release-age policy; npm has no equivalent, so freshly-published versions install immediately.

## Environment

- Node 24 required
- `GITHUB_PAT` — required for runtime data fetching and for `npm run codegen`
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry (optional locally)
- `SITE_URL` — overrides the canonical origin used for absolute URLs/metadata (optional; defaults to the production domain — see `src/site.ts`)

## Architecture

Personal site built with Next.js App Router, TypeScript (strictest config), and Tailwind CSS v4. Styling is plain Tailwind utility classes (no component library); `lucide-react` provides icons.

**Data flow:**

1. `src/clients/user-query.ts` — typed GraphQL document (built with `gql.tada`'s `graphql()` from `src/clients/graphql.ts`) queried against the GitHub API
2. `src/clients/github.ts` — authenticated fetch + `zod/mini` parse of the raw GitHub response
3. `src/fetchers/data-action.ts` — shapes/filters the parsed response into `DataResult`, validates the final shape with `zod/mini`. This is the single source of truth for all page data.
4. `src/app/*` — server components consume `getDataAction()` directly from inside a `'use cache'` scope

**Key conventions:**

- Components are server-side by default; `'use client'` only when hooks/browser APIs are needed.
- `getDataAction()` has no `'use server'` directive — it is not a server action, just an async function called directly from server components.
- GraphQL types come from `gql.tada` (no codegen step that emits per-query types). Documents are written with `graphql()` from `src/clients/graphql.ts`; their result types are inferred at compile time via `src/graphql-env.d.ts`. To get the query string for a raw `fetch` body, use `print()` from `graphql` (see `github.ts`). The GitHub `URI`/`DateTime` scalars are mapped to `string` in `graphql.ts` so document types line up with the zod schema. `src/graphql-env.d.ts` and `github-schema.graphql` are generated and **git-ignored** — never hand-edit or commit them. They're regenerated automatically: `postinstall` runs `npm run codegen` when `GITHUB_PAT` is set and the file is missing, and `npm run build` regenerates them first if absent (so CI, whose build step has the token, is self-sufficient). Run `npm run codegen` manually (with `GITHUB_PAT` set) after a fresh clone to populate editor/lint types, or whenever the GitHub schema changes. Editing an existing query needs no regeneration — types re-infer from the local `github-schema.graphql`. Trade-off: typecheck/lint/build now require `GITHUB_PAT` + network to (re)generate types rather than reading a committed file.
- Zod schemas import from `zod/mini` (the tree-shakeable subset of the `zod` v4 package, also listed in `optimizePackageImports`) — never import from `zod` directly; follow existing patterns.
- `src/site.ts` exports `SITE_URL`, the canonical origin (no trailing slash, overridable via the `SITE_URL` env var for preview deploys). It is the single source for absolute URLs — `layout.tsx` metadata, `robots.ts`, and `sitemap.ts` all read it rather than hardcoding the domain.
- Repository sort order: pinned first, then by star count, then by `pushedAt`. This logic lives in `data-action.ts`.
- Caching lives at the route level: `page.tsx` and `sitemap.ts` open a `'use cache'` scope with `cacheLife('days')` (Next.js 16 Cache Components, enabled via `cacheComponents: true` in `next.config.ts`). `getDataAction()` itself has no `cache()` wrapper or fetch-level `revalidate` — it inherits caching from the calling scope.
- The React Compiler is enabled (`reactCompiler: true`). Write components in standard React style — the compiler handles memoization. Avoid patterns it can't optimize (conditional hook calls, etc.). The compiler's lint rules come from `eslint-plugin-react-hooks` (v6+, pulled in and enabled by `eslint-config-next`'s `recommended` config — surfaced as the granular `react-hooks/*` rules like `set-state-in-render`, `purity`, `immutability`). Do **not** add the standalone `eslint-plugin-react-compiler`: React Compiler 1.0 merged those rules into `eslint-plugin-react-hooks`, so the standalone package is deprecated and redundant here.
- `tagline.tsx` and `tech-stack.tsx` are fully hardcoded static content — no GitHub API involvement. Everything else on the page comes from `getDataAction()`.
- Security headers live in `next.config.ts` `headers()` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`). We deliberately do **not** ship a Content-Security-Policy: the App Router emits inline RSC-payload scripts, so a CSP would need either `script-src 'unsafe-inline'` (weak, little real protection) or a per-request nonce (which forces dynamic rendering and breaks the `'use cache'` static model), and the third-party origin list is easy to get subtly wrong. For a static site with no user-generated content the maintenance risk outweighs the benefit — don't add a CSP without a deliberate decision to take that on.

**Testing conventions:**

- Tests live in `__tests__/` subdirectories alongside source files. Vitest runs with `environment: 'node'` and no globals (config in `vitest.config.ts`).
- The test toolchain has a non-obvious dependency: `vitest.config.ts` uses `@vitejs/plugin-react` to transform JSX in `.tsx` test files, and `vite` is a required (non-optional) peer of vitest 4 — so both `vite` and `@vitejs/plugin-react` must stay explicit `devDependencies`. If `vite` drops out of the tree (e.g. a lockfile regen), a clean `npm ci` leaves vitest unable to import it and `npm test` fails at startup with `ERR_MODULE_NOT_FOUND` — even though it may still pass locally on a stale `node_modules`.
- `transformGithubUserToData` (in `data-action.ts`) is the pure, sync extraction of all data-shaping logic. Test data transformations through it directly rather than mocking `fetch`.
- Use `renderToStaticMarkup` + `createElement` (from `react-dom/server`) to test server component output without a DOM environment.
- Use `vi.stubGlobal('fetch', vi.fn(...))` to mock network calls in `github.ts` tests; restore with `vi.unstubAllGlobals()` in `afterEach`.
- Test factory functions (`makeRepository`, `makeUser`) require explicit `id` fields — no auto-generated fallbacks.

## Code Style

Keep code comments short — one brief line; point to CLAUDE.md or commit messages for rationale instead of explaining inline.

ESLint uses `typescript-eslint` strict + `prettier` flat config. The generated `src/graphql-env.d.ts` is excluded from lint (it carries its own `eslint-disable`/`prettier-ignore` headers too). `prettier-plugin-tailwindcss` is active — Tailwind class order is enforced automatically, don't reorder manually.

**ESLint is deliberately held at 9 (exact pin) — don't bump to 10.** The plugin ecosystem behind `eslint-config-next` hasn't caught up: `eslint-plugin-react`, `eslint-plugin-import`, and `eslint-plugin-jsx-a11y` all declare `eslint` peers capped at `^9`. On ESLint 10 that isn't just a warning — `eslint-plugin-react`'s React-version detection calls `context.getFilename()`, an API ESLint 10 removed, which throws while loading `react/display-name` and takes down every `react/*` rule (and with it `npm run build`, since lint runs concurrently). Setting `settings.react.version` explicitly works around that one crash, but leaves the other two plugins unsupported, so we stay on 9 instead. Revisit once those plugins ship ESLint 10 support — `eslint-plugin-react` > 7.37.5 is the one to watch.

The pin is the exact `"eslint": "9.39.5"` devDependency in `package.json` — keep it exact, not a range. A blanket dependency bump has silently re-introduced eslint 10 before (the previous pnpm setup carried a second override as a backstop; the npm setup deliberately has no `overrides` block, so the devDependency specifier is the only guard). After any dependency bump, confirm with `npm ls eslint` that the whole tree still resolves to 9.x. Bumping the specifier to 10 is the deliberate first step of an actual ESLint 10 upgrade — never do it as part of a routine bump.

Sentry is wired across three runtimes via `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts`. The shared subset (DSN, `debug`, `ignoreErrors`) lives in `sentry.shared-options.ts` and is spread into each `init()` call — change it there to affect all three runtimes; only override per-runtime keys (e.g. `tracesSampleRate`, replay sampling) in the runtime file.

**Sentry client bundle — do not re-litigate.** The Sentry browser SDK is the largest client chunk (~127 KB gzip) and loads eagerly via `instrumentation-client.ts`. This is already at Sentry's recommended minimum and should be left as-is:

- The only lever Sentry recommends is tree-shaking (don't import unused integrations). We already do this — `init()` adds no integrations, so Session Replay, Browser Tracing, and Profiling are all excluded (verified: no replay/rrweb code ships).
- `bundleSizeOptimizations` (`excludeTracing`, `excludeDebugStatements`) are set in `next.config.ts` but are **no-ops under Turbopack** (our build) — Sentry's tree-shaking transforms only run on webpack. Keep them anyway so they activate automatically if Turbopack tree-shaking lands later; revisit this chunk after Next/Sentry upgrades.
- Do **not** suggest lazy-loading or deferring the core SDK `init()` to cut the bundle. Sentry recommends lazy-loading only for Session Replay (unused here), and deferring core init sacrifices early-error capture for a page that already paints instantly as static HTML. Not worth it.

## Verification

Match the check to the change:

- Unit logic — `npm test`
- Normal code edits — `npm run lint`
- Removing an export, dep, or file — `npm run knip` (CI fails on anything left unused)
- Dependency major bumps — watch `npm install` output for `ERESOLVE` peer warnings and inspect with `npm ls <pkg>`; the tree currently has no accepted mismatches (`graphql` is held at ^16 because `@0no-co/graphql.web`, under `gql.tada`, caps its peer at ^16 — don't bump to 17 until it does), so any `ERESOLVE` warning indicates a problem.
- GitHub schema changes — `npm run codegen` (regenerates the git-ignored `github-schema.graphql` + `src/graphql-env.d.ts`; editing an existing query needs no regeneration)
- Runtime behavior, caching, Next config, Sentry wiring, or data fetching — `npm run build`
- If `GITHUB_PAT` is unavailable locally, state which checks were blocked.
- A failing `npm run build` may be the lint leg, not your change — check the `[build]`/`[lint]` output prefix, and reproduce on a clean tree before attributing it to your edit.
