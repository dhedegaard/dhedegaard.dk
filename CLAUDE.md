# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm ci` — lockfile-faithful install; use `npm install` only when intentionally updating deps
- `npm run dev` — dev server with Turbopack
- `npm run build` — production build (runs `next build` and lint concurrently; this is the CI check)
- `npm run lint` — ESLint only
- `npm run typecheck` — `tsc --noEmit` (standalone; `npm run build` also typechecks)
- `npm test` — Vitest test suite (`vitest run`)
- `npm test -- src/path/to/file.test.ts` — run a single test file
- `npm run knip` — detect unused exports, deps, and files (zero-config; hard CI gate)
- `npm run codegen` — regenerate GraphQL types from GitHub API (requires `GITHUB_PAT` env var)

`npm run build` is the primary correctness check; `npm test` covers unit logic. CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm test`, `npm run build` (with `GITHUB_PAT` injected), then `npm run knip` on push — all four are hard gates, so a green local build alone does not mean green CI. knip runs _after_ the build on purpose: it needs the generated `src/graphql-env.d.ts` that `graphql.ts` imports, so running it on a fresh clone before `npm run codegen` fails on an unresolvable import. knip itself needs no `GITHUB_PAT`.

Packages with install scripts must be allowlisted in `package.json` `allowScripts` (npm's script gate) — entries are pinned as `pkg@version`, so bumping an allowlisted package (e.g. `@sentry/cli`) silently skips its install script (warn-only, install still succeeds) until re-approved with `npm approve-scripts <pkg>` after confirming the package is trusted. Note: the migration from pnpm dropped pnpm's minimum-release-age policy; npm has no equivalent, so freshly-published versions install immediately.

## Environment

- Node 24 required — enforced at install via `.npmrc` `engine-strict=true` (deliberate, replaces pnpm's built-in engines check); wrong Node fails `npm ci`
- npm >=11 required — enforced by `package.json` `devEngines.packageManager` (`onFail: "error"`), which npm checks on install; it also makes pnpm refuse to run. Don't reintroduce `packageManager`: npm ignores it and Corepack is off by default, so an exact pin there is never enforced
- `GITHUB_PAT` — required for runtime data fetching and for `npm run codegen`
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry (optional locally)
- `SITE_URL` — overrides the canonical origin used for absolute URLs/metadata (optional; defaults to the production domain — see `src/site.ts`)
- `VERCEL_ENV` — read at build time by `cspHeaders()` (preview toolbar allowance, `sentry_environment` on reports); on Vercel it's only present because the project has "Automatically expose System Environment Variables" enabled — don't disable it

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
- Adding a GitHub field means editing both the `graphql()` document in `user-query.ts` and the zod schema in `github.ts`. Typecheck catches a mismatch in either direction: the `satisfies` in `github.ts` checks one way, and an `expectTypeOf` in `user-query.test.ts` checks the other.
- Zod schemas import from `zod/mini` (the tree-shakeable subset of the `zod` v4 package, also listed in `optimizePackageImports`) — never import from `zod` directly; follow existing patterns.
- `src/site.ts` exports `SITE_URL`, the canonical origin (no trailing slash, overridable via the `SITE_URL` env var for preview deploys). It is the single source for absolute URLs — `layout.tsx` metadata, `robots.ts`, and `sitemap.ts` all read it rather than hardcoding the domain.
- Repository sort order: archived repos always last (shown with an "Archived" badge), then pinned first, then by star count, then by `pushedAt`. This logic lives in `data-action.ts`. There's no render cap: the query's `first: 100` (no pagination) is the only limit, so past 100 public repos the least recently pushed ones drop silently.
- Language stats (`computeLanguageStats` in `data-action.ts`, rendered by `language-stats.tsx`) weight each non-archived, non-fork repo equally, split by byte share (each language's `size` over the sum of the repo's language sizes), so one large repo can't dominate. The top 8 are shown and the rest fold into "Other". Archived repos and forks are excluded from the stats only; they're still listed.
- Caching lives at the route level: `page.tsx` and `sitemap.ts` open a `'use cache'` scope — `page.tsx` with a custom `cacheLife` (refresh hourly, 30-day expiry, so stars and new repos show within the hour while a broken `GITHUB_PAT` leaves weeks of grace before the page errors), `sitemap.ts` with `cacheLife('days')` (Next.js 16 Cache Components, enabled via `cacheComponents: true` plus `partialPrefetching: true` in `next.config.ts`). `getDataAction()` itself has no `cache()` wrapper or fetch-level `revalidate` — it inherits caching from the calling scope.
- The root `layout.tsx` exports `ensureStatic = 'navigation'`, so `next dev`/`next build` fail on any request-time server work in any route: uncached fetches, `cookies()`/`headers()`/`connection()`, or a `cacheLife` with `stale` < 30s or `expire` < 5min — even inside `<Suspense>`. This enforces the static-prerender requirement the CSP relies on; debug failures with `npx next build --debug-prerender`.
- The React Compiler is enabled (`reactCompiler: true`). Write components in standard React style — the compiler handles memoization. Avoid patterns it can't optimize (conditional hook calls, etc.). The compiler's lint rules come from `eslint-plugin-react-hooks` (v6+, pulled in and enabled by `eslint-config-next`'s `recommended` config — surfaced as the granular `react-hooks/*` rules like `set-state-in-render`, `purity`, `immutability`). Do **not** add the standalone `eslint-plugin-react-compiler`: React Compiler 1.0 merged those rules into `eslint-plugin-react-hooks`, so the standalone package is deprecated and redundant here.
- `tagline.tsx`, `tech-stack.tsx`, and `LINKEDIN_URL` in `find-me-element.tsx` are hardcoded — no GitHub API involvement. Everything else on the page comes from `getDataAction()`. `layout.tsx`'s JSON-LD `knowsAbout` is built from the exported `STACK`, so editing the tech stack updates the structured data too.
- Security headers live in `next.config.ts` `headers()` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, CSP). The CSP comes from `cspHeaders()` in `src/csp.ts` and is **enforced** (`Content-Security-Policy`, after a report-only rollout), reporting violations straight to Sentry's security endpoint (derived from `NEXT_PUBLIC_SENTRY_DSN`; no DSN → no reporting). Sentry ingests these as `csp` events at `error` level (accepted) and filters extension noise under Project Settings → Security Headers — a real `csp` event now means something was **blocked**. Emergency rollback: rename the header in `cspHeaders()` back to `Content-Security-Policy-Report-Only`. `upgrade-insecure-requests` is omitted in dev because Safari upgrades `http://localhost` too (a local `next start` in Safari will still break on it). **The site must stay statically prerendered — no proxy/middleware for CSP** — which rules out nonces, so `script-src` uses `'unsafe-inline'` (experimental SRI doesn't cover inline RSC-payload scripts). Previews also allow the Vercel toolbar; dev adds `'unsafe-eval'`. **Keep the CSP in sync with the site:** any change that adds, removes, or moves a script, stylesheet, image/font host, fetch/websocket target, iframe, or third-party integration (analytics, Sentry, embeds) must update `cspHeaders()` and `src/__tests__/csp.test.ts` in the same change — and drop origins that are no longer used. The `sentry_key` in the report URI is the public DSN key (already shipped in the client bundle) — exposing it is fine. No same-origin Sentry tunnel/proxy: losing reports from visitors whose ad blockers block `*.sentry.io` is an accepted risk.

**Testing conventions:**

- Tests live in `__tests__/` subdirectories alongside source files. Vitest runs with `environment: 'node'` and no globals (config in `vitest.config.ts`).
- The test toolchain has a non-obvious dependency: `vitest.config.ts` uses `@vitejs/plugin-react` to transform JSX in `.tsx` test files, and `vite` is a required (non-optional) peer of vitest (still true as of v5) — so both `vite` and `@vitejs/plugin-react` must stay explicit `devDependencies`. If `vite` drops out of the tree (e.g. a lockfile regen), a clean `npm ci` leaves vitest unable to import it and `npm test` fails at startup with `ERR_MODULE_NOT_FOUND` — even though it may still pass locally on a stale `node_modules`.
- `transformGithubUserToData` (in `data-action.ts`) is the pure, sync extraction of all data-shaping logic. Test data transformations through it directly rather than mocking `fetch`.
- Use `renderToStaticMarkup` + `createElement` (from `react-dom/server`) to test server component output without a DOM environment.
- Use `vi.stubGlobal('fetch', vi.fn(...))` to mock network calls in `github.ts` tests; restore with `vi.unstubAllGlobals()` in `afterEach`.
- Vitest 5 defaults to `clearMocks: true` — don't add `vi.clearAllMocks()` in `afterEach`; spies still need `mockRestore()`.
- Test factory functions (`makeRepository`, `makeUser`) require explicit `id` fields — no auto-generated fallbacks.

## Code Style

Keep code comments short — one brief line; point to CLAUDE.md or commit messages for rationale instead of explaining inline.

ESLint uses `typescript-eslint` `strictTypeChecked` (type-aware via `projectService`) + `prettier` flat config. The generated `src/graphql-env.d.ts` is excluded from lint (it carries its own `eslint-disable`/`prettier-ignore` headers too). `prettier-plugin-tailwindcss` is active — Tailwind class order is enforced automatically, don't reorder manually.

Prettier isn't enforced by lint or CI: `eslint-config-prettier` only turns off conflicting rules, and there's no `format` script. Run `npx prettier --write <files>` on files you touch (that's also what applies the Tailwind class order). Several older files aren't Prettier-clean yet, so formatting a file you touch can add unrelated Tailwind class-order changes. That's expected; mention it in the commit message.

**ESLint is deliberately held at 9 — don't bump to 10.** The plugin ecosystem behind `eslint-config-next` hasn't caught up: `eslint-plugin-react`, `eslint-plugin-import`, and `eslint-plugin-jsx-a11y` all declare `eslint` peers capped at `^9`. On ESLint 10 that isn't just a warning — `eslint-plugin-react`'s React-version detection calls `context.getFilename()`, an API ESLint 10 removed, which throws while loading `react/display-name` and takes down every `react/*` rule (and with it `npm run build`, since lint runs concurrently). Setting `settings.react.version` explicitly works around that one crash, but leaves the other two plugins unsupported, so we stay on 9 instead. Revisit once those plugins ship ESLint 10 support — `eslint-plugin-react` > 7.37.5 is the one to watch.

The pin is the `"eslint": "^9.39.5"` devDependency in `package.json` — a caret range (9.x patches/minors float, floor at 9.39.5), never `*`/`latest`/`>=`. A blanket dependency bump has silently re-introduced eslint 10 before (the previous pnpm setup carried a second override as a backstop; the npm `overrides` block has no eslint entry, so the devDependency specifier is the only guard). After any dependency bump (including Next.js upgrades — 16.4.0 rewrote it to an exact `9.39.5`), confirm the specifier is still `^9.39.5` and `npm ls eslint` still resolves to 9.x. Bumping the specifier to 10 is the deliberate first step of an actual ESLint 10 upgrade — never do it as part of a routine bump.

Sentry is wired across three runtimes via `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts`. The shared subset (DSN, `debug`, `ignoreErrors`) lives in `sentry.shared-options.ts` and is spread into each `init()` call — change it there to affect all three runtimes. No runtime file overrides anything today; per-runtime keys (e.g. `tracesSampleRate`) would go in that runtime's file.

**Sentry client bundle — do not re-litigate.** The Sentry browser SDK is the largest client chunk (~127 KB gzip) and loads eagerly via `instrumentation-client.ts`. This is already at Sentry's recommended minimum and should be left as-is:

- The only lever Sentry recommends is tree-shaking (don't import unused integrations). We already do this — `init()` adds no integrations, so Session Replay, Browser Tracing, and Profiling are all excluded (verified: no replay/rrweb code ships).
- `bundleSizeOptimizations` (`excludeTracing`, `excludeDebugStatements`) are set in `next.config.ts` but are **no-ops under Turbopack** (our build) — Sentry's tree-shaking transforms only run on webpack. Keep them anyway so they activate automatically if Turbopack tree-shaking lands later; revisit this chunk after Next/Sentry upgrades.
- Do **not** suggest lazy-loading or deferring the core SDK `init()` to cut the bundle. Sentry recommends lazy-loading only for Session Replay (unused here), and deferring core init sacrifices early-error capture for a page that already paints instantly as static HTML. Not worth it.

## Verification

Match the check to the change:

- Unit logic — `npm test`
- Normal code edits — `npm run lint`
- Removing an export, dep, or file — `npm run knip` (CI fails on anything left unused)
- `knip --production` flags `src/csp.ts` (it only treats `next.config.ts` as an entry outside production mode) and test-only exports like `transformGithubUserToData` — expected, not dead code
- Dependency major bumps — watch `npm install` output for `ERESOLVE` peer warnings and inspect with `npm ls <pkg>`; the tree currently has no accepted mismatches, so any `ERESOLVE` warning indicates a problem. `typescript` is held at 6 until `typescript-eslint` widens its `typescript <6.1.0` peer.
- Next.js upgrades — `npx @next/codemod upgrade` fails under npm 12: it runs `npm view … --field version`, npm 12 rejects the unknown flag, and the codemod surfaces it as a misleading `Invalid revision provided`. Run it with npm 11 on PATH: `npx -y -p npm@11 -p @next/codemod@<ver> -c 'codemod upgrade <ver>'`, then restore `^9.39.5` on `eslint`.
- GitHub schema changes — `npm run codegen` (regenerates the git-ignored `github-schema.graphql` + `src/graphql-env.d.ts`; editing an existing query needs no regeneration)
- graphql / gql.tada bumps — `npx gql.tada generate-output` rebuilds `src/graphql-env.d.ts` from the local schema (no token/network); identical output means the bump is type-neutral. A full `npm run codegen` also pulls GitHub's upstream schema changes, so a schema diff there isn't caused by the bump.
- Runtime behavior, caching, Next config, Sentry wiring, or data fetching — `npm run build`
- `ensureStatic` guard still enforced (after Next upgrades) — temporarily add `src/app/<probe>/page.tsx` that does `await connection()` inside `<Suspense>`; `npx next build` must fail with "must be fully static". Delete the probe afterwards, then run `npm run build` once: the failed build leaves `.next/types/validator.ts` pointing at the deleted page, which breaks `npm run typecheck` until the types regenerate.
- `loading.tsx` only shows during client navigation. To see it, temporarily add `src/app/<probe>/page.tsx` that renders `<Loading />` (imported from `../loading`), open it on the dev server, then delete it.
- Metadata / JSON-LD changes: `curl -s localhost:3000/` and parse the `<meta name="description">` tag and the `application/ld+json` script. No unit test covers `layout.tsx`'s metadata.
- Prefetch / client-navigation changes — only observable in a production build (`npm run build`, then `npx next start -p <port>`). The 404 page's `<Link href="/">` is the site's only client navigation; its prefetch shows up as `/?_rsc=…` requests.
- Anything that loads a new external resource or integration — check `cspHeaders()` in `src/csp.ts` still allows it (and nothing stale remains), then `npm test`
- CSP headers locally — `NEXT_PUBLIC_SENTRY_DSN=<dummy> VERCEL_ENV=production npm run build`, then `npx next start -p <port>` and `curl -sI`; a dummy DSN gets baked into `.next`, so rebuild afterwards. Locally, `/_vercel/*` scripts 404 (Vercel serves them), which is not a CSP issue, and headless Chrome won't deliver Reporting API reports over http localhost. To check enforcement, load the page in a browser: CSP blocks show as console errors (`Refused to …`). With the dummy DSN, Sentry `envelope` requests return 400, which means they got through.
- Production headers — `curl -sI https://www.dhedegaard.dk/` (the apex 308-redirects to `www`, so curl it with `-L` or you'll see no CSP header)
- On production, Vercel Analytics/Speed Insights load from hashed same-origin paths (e.g. `/ce77bbabbf5abf1f/script.js`), not `/_vercel/*`. `'self'` already covers them, so don't add Vercel origins for them.
- In `next dev`, the console shows CSP `Loading the script … violates` errors for Vercel Analytics/Speed Insights debug scripts from `va.vercel-scripts.com`. This is dev-only and expected; production serves them same-origin.
- `next dev` can show a server error from an earlier render (e.g. a query/schema mismatch mid-edit) in the browser console even after a reload. Check the current state with `curl -s localhost:3000/ | grep …` before chasing it.
- In Claude's browser pane, dark-mode emulation renders a dark canvas behind black text. Emulate a light colour scheme before visual checks.
- Preview deployments (`dhedegaard-dk-git-<branch>-d-hedegaard.vercel.app`) are behind Vercel Deployment Protection (`curl` gets a 302), so check their headers in a logged-in browser or on production.
- `GITHUB_PAT` is in `.env` (Next loads it, so `npm run build` works) and `.envrc`, but the tool shell doesn't load direnv — run codegen as `(source ./.envrc && npm run codegen)` and never echo the value. Only if neither file has it, state which checks were blocked.
- A failing `npm run build` may be the lint leg, not your change — check the `[build]`/`[lint]` output prefix, and reproduce on a clean tree before attributing it to your edit.
