# CLAUDE.md

## Commands

- `npm ci` for installs; `npm install` only when intentionally updating deps
- `npm run build` — production build (runs `next build` and lint concurrently; this is the CI check)
- `npm run knip` — detect unused exports, deps, and files (zero-config; hard CI gate)
- `npm run codegen` — regenerate GraphQL types from GitHub API (requires `GITHUB_PAT` env var)
- `.claude/launch.json` — preview configs: `dev` (`npm run dev`, port 3000, or the next free one) and `prod` (`next start` on 3100, after `npm run build`)
- Release: rebase the branch on `origin/main`, then `git push origin <branch>:main` (fast-forward; no PR, no merge commit). Then watch the CI workflow and the Vercel commit status. Markdown-only pushes get no CI run (`paths-ignore: ['**/*.md']`), only Vercel.

`npm run build` is the primary correctness check; `npm test` covers unit logic. CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm test`, `npm run build` (with `GITHUB_PAT` injected), then `npm run knip` on push — all four are hard gates, so a green local build alone does not mean green CI. knip runs _after_ the build on purpose: it needs the generated `src/graphql-env.d.ts` that `graphql.ts` imports, so running it on a fresh clone before `npm run codegen` fails on an unresolvable import. knip itself needs no `GITHUB_PAT`.

Packages with install scripts must be allowlisted in `package.json` `allowScripts` (npm's script gate) — entries are pinned as `pkg@version`, so bumping an allowlisted package (e.g. `unrs-resolver`) silently skips its install script (warn-only, install still succeeds) until re-approved with `npm approve-scripts <pkg>` after confirming the package is trusted. npm has no minimum release age, so freshly published versions install immediately.

## Environment

- Node 24 required — enforced at install via `.npmrc` `engine-strict=true` (deliberate, replaces pnpm's built-in engines check); wrong Node fails `npm ci`
- npm >=11 required — enforced by `package.json` `devEngines.packageManager` (`onFail: "error"`), which npm checks on install; it also makes pnpm refuse to run. Don't reintroduce a top-level `packageManager`: npm ignores it and Corepack is off by default, so an exact pin there is never enforced
- `GITHUB_PAT` — required for runtime data fetching and for `npm run codegen`
- `GITHUB_PAT` is in `.env` (Next loads it, so `npm run build` works) and `.envrc`, but the tool shell doesn't load direnv — run codegen as `(source ./.envrc && npm run codegen)` and never echo the value. Only if neither file has it, state which checks were blocked.
- `GITHUB_PAT` is a classic token scoped `public_repo` + `read:user` (no `repo`/`read:org`): fields needing `read:org` (e.g. `user.organizations`) fail with `INSUFFICIENT_SCOPES`, and private repos return no `languages`
- `GITHUB_CONTRIBUTION_ACCOUNTS` — comma-separated GitHub logins whose contribution calendars are summed into the Activity heatmap (optional; unset hides the section). The repo is public, so these GitHub logins live only in `.env`/`.envrc` and the Vercel project env — never in code, tests, docs or commit messages. Private contributions count only if `GITHUB_PAT` has the `read:user` scope and, per account, either the token's owner can see those repos or the account shares private contribution counts on its profile; otherwise they silently drop out. Check with `restrictedContributionsCount` (0 means nothing hidden). CI has no value for it, so CI builds hide the section; only Vercel builds run the real fetch.
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry (optional locally)
- `SITE_URL` — overrides the canonical origin used for absolute URLs/metadata (optional; defaults to the production domain — see `src/site.ts`)
- `VERCEL_ENV` — read at build time by `cspHeaders()` (preview toolbar allowance, `sentry_environment` on reports); on Vercel it's only present because the project has "Automatically expose System Environment Variables" enabled — don't disable it

## Architecture

Styling is plain Tailwind utility classes (no component library); icons are inlined SVG components in `src/icons/` (`lucide.tsx` copies the few Lucide icons used, since `lucide-react`'s `Icon` is a client component).

### Key conventions

- `getDataAction()` has no `'use server'` directive — it is not a server action, just an async function called directly from server components.
- GraphQL types come from `gql.tada` (no codegen step that emits per-query types):
  - Documents are written with `graphql()` from `src/clients/graphql.ts`; their result types are inferred at compile time via `src/graphql-env.d.ts`. To get the query string for a raw `fetch` body, use `print()` from `graphql` (see `github.ts`). The GitHub `URI`/`DateTime`/`Date` scalars are mapped to `string` in `graphql.ts` so document types line up with the zod schema.
  - `src/graphql-env.d.ts` and `github-schema.graphql` are generated and **git-ignored** — never hand-edit or commit them. `postinstall` runs `npm run codegen` when `GITHUB_PAT` is set and the file is missing, and `npm run build` regenerates them first if absent (so CI, whose build step has the token, is self-sufficient).
  - Run `npm run codegen` manually (with `GITHUB_PAT` set) after a fresh clone to populate editor/lint types, or whenever the GitHub schema changes. Editing an existing query needs no regeneration — types re-infer from the local `github-schema.graphql`. Trade-off: typecheck/lint/build require `GITHUB_PAT` + network to (re)generate types rather than reading a committed file.
- Adding a GitHub field means editing both the `graphql()` document (`user-query.ts` or `contributions-query.ts`) and its zod schema in `github.ts`. Typecheck catches a mismatch in either direction: the `satisfies` in `github.ts` checks one way, and an `expectTypeOf` in the query's test checks the other.
- Zod schemas import from `zod/mini` (the tree-shakeable subset of the `zod` v4 package, also listed in `optimizePackageImports`) — never import from `zod` directly; follow existing patterns. In client bundles Turbopack still ships its unused string formats (~19 KB gzip for one codec). Neither `optimizePackageImports` nor the namespace import helps, and `turbopackModuleFragments` breaks the build, so don't retry them.
- `src/site.ts` exports `SITE_URL`, the canonical origin (no trailing slash, overridable via the `SITE_URL` env var for preview deploys). It is the single source for absolute URLs — `layout.tsx` metadata, `json-ld.ts`, `robots.ts`, and `sitemap.ts` all read it rather than hardcoding the domain.
- Repository sort order: archived repos always last (shown with an "Archived" badge), then pinned first, then by star count, then by `pushedAt`. This logic lives in `data-action.ts`. There's no render cap: the query's `first: 100` (no pagination) is the only limit, so past 100 public repos the least recently pushed ones drop silently.
- Language stats (`computeLanguageStats` in `data-action.ts`, rendered by `language-stats.tsx`): weighting, exclusions and caps are in `.claude/rules/language-stats.md`, which loads when you touch those files.
- Activity heatmap (one 12-month window at a time, newest first): fetching, shaping, failure handling, client state and grid sizing are in `.claude/rules/activity-heatmap.md`, which loads when you touch the heatmap files.
- Caching lives at the route level: `page.tsx` and `sitemap.ts` open a `'use cache'` scope — `page.tsx` with a custom `cacheLife` (refresh hourly, 30-day expiry, so stars and new repos show within the hour while a broken `GITHUB_PAT` leaves weeks of grace before the page errors), `sitemap.ts` with `cacheLife('days')` (Next.js 16 Cache Components, enabled via `cacheComponents: true` plus `partialPrefetching: true` in `next.config.ts`). `getDataAction()` itself has no `cache()` wrapper or fetch-level `revalidate` — it inherits caching from the calling scope.
- The root `layout.tsx` exports `ensureStatic = 'navigation'`, so `next dev`/`next build` fail on any request-time server work in any route: uncached fetches, `cookies()`/`headers()`/`connection()`, or a `cacheLife` with `stale` < 30s or `expire` < 5min — even inside `<Suspense>`. This enforces the static-prerender requirement the CSP relies on; debug failures with `npx next build --debug-prerender`.
- The React Compiler is enabled (`reactCompiler: true`). Write components in standard React style — the compiler handles memoization. Avoid patterns it can't optimize (conditional hook calls, etc.). The compiler's lint rules come from `eslint-plugin-react-hooks` (v6+, pulled in and enabled by `eslint-config-next`'s `recommended` config — surfaced as the granular `react-hooks/*` rules like `set-state-in-render`, `purity`, `immutability`). Do **not** add the standalone `eslint-plugin-react-compiler`: React Compiler 1.0 merged those rules into `eslint-plugin-react-hooks`, so the standalone package is deprecated and redundant here.
- A third-party component marked `"use client"` (lucide-react's `Icon` was one) makes every instance rendered from a server component a hydrated client reference. Check `.next/server/app/index.rsc` for repeated `"$L<n>"` references and their `<n>:I[…]` rows before adding an icon or UI library.
- The home page footer (`site-footer.tsx`) shows the deploy time and commit, and when the cached page was generated (`page.tsx`'s `now`), all in UTC. `getDeployment()` in `src/deployment.ts` reads Vercel's `VERCEL_GIT_COMMIT_SHA`, which is set at build and at runtime, and `DEPLOYED_AT`, which `next.config.ts` `env` inlines at build. `DEPLOYED_AT` must be read with dot access for Next to inline it, and it's typed in `src/deployment-env.d.ts`. The page's own clock can't stand in for the deploy time: it shows the last hourly refresh. Without a commit (local and CI builds), the "Deployed … from …" part is left out.
- `tagline.tsx`, `tech-stack.tsx`, `about-me-data.ts`, and `site-meta.ts` (name, description, `LINKEDIN_URL`) are hardcoded — no GitHub API involvement. Everything else on the page comes from `getDataAction()`, except the heatmap's `getHeatmapWindows(now)`. The JSON-LD (`json-ld.ts`) builds `knowsAbout` from the exported `STACK`, so editing the tech stack updates the structured data too.
- About-me content (About with hobbies, Experience, Education, spoken languages, location) is hardcoded in `src/app/about-me-data.ts`, like `STACK`, and rendered by `about-me-sections.tsx`. For now `page.tsx` gives About, Experience and Education `hidden print:block` (plus their print margins), so they show only when printing; they're still in the HTML. The JSON-LD `worksFor`, `alumniOf` and `address` derive from it; a school's `abbreviation` becomes `alternateName`. Site metadata constants live in `site-meta.ts`, since `layout.tsx` can't export extra names. Company names in the about-me sections are fine in the repo; the GitHub logins in `GITHUB_CONTRIBUTION_ACCOUNTS` are not, and the heatmap and language bar captions never name a company.
- Print: `print:` variants plus `@page` (A4) in `globals.css`; no print-only components except `print-stamp.tsx` (a "From dhedegaard.dk · <month>" line under the location, dated by the deployment, else `now`).
  - Hidden in print: the heatmap, the repositories and the footer (`print:hidden`, tested). The tech stack and language bar always print; badges and the bar keep their colours via one `print-color-adjust: exact` rule on `html` in `globals.css`.
  - `FindMeElement` prints as blue icon-plus-target text (`github.com/…`, the email) instead of buttons; LinkedIn is `print:hidden`. Only the copy under the avatar prints; the avatar column widens to fit it (`print:w-auto`), beside the name, tagline and tech stack.
  - Page breaks: each job/degree `<article>` and the tech stack and bar are `print:break-inside-avoid`; `HeadedList` in `about-me-sections.tsx` wraps each heading with its first entry (Firefox ignores `break-after: avoid`).
  - An A4 page is about 673 CSS px wide, below `md`, so `max-md:` classes apply in print and `md:` ones don't. Tailwind v4 emits `print:` rules after the breakpoint rules, so a `print:` class always overrides them.
  - Tailwind's build (Lightning CSS) adds the `-webkit-` prefix itself, e.g. for `print-color-adjust`. Don't add prefixed classes by hand.
  - The print margins of About/Experience/Education are set in `page.tsx`; the last printed section has `print:mb-0`, or its margin spills onto a blank third page.
- CSS custom properties passed through `style` (e.g. `--weeks`) are typed in `src/css-vars.d.ts`, which augments React's `CSSProperties`. Add new ones there instead of casting with `as CSSProperties`.
- The loading skeleton (`loading.tsx`, shown only on client navigation) reuses the page's frames: `PageHeader` with the real name, tagline, location and tech stack, and each data section's frame (`LanguagesSection`, `ActivitySection`, `RepositoriesSection`). Only GitHub data gets placeholders, from an `XSkeleton` next to each component (`skeleton.tsx` has `BONE` and `TextBone`); the heatmap's lives in `activity-section.tsx`, outside the `'use client'` file. A section added to `page.tsx` needs its own `XSkeleton` in `loading.tsx`; `loading.test.tsx` fails until both list the same on-screen sections in the same order. The skeleton is prerendered, so it can't know when the page hides Activity or Languages because of a failed fetch or no data.
- Section `<h2>`s use `SectionHeading` (`section-heading.tsx`). Only Activity writes its own, because its margin sits on the row it shares with the controls.
- Hardcoded data (`STACK`, `about-me-data.ts`) is `as const satisfies T`. When the literal types get in the way (an optional field missing on some entries), widen at the consumer instead: type the prop as the interface, or write `new Set<Degree['school']>(…)`.
- `DataResult.email` is never null: `transformGithubUserToData` falls back to the site email when GitHub has no valid public one, so the Email link always shows.
- Security headers live in `next.config.ts` `headers()` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, CSP). The CSP comes from `cspHeaders()` in `src/csp.ts`:
  - It is **enforced** (`Content-Security-Policy`, after a report-only rollout). Emergency rollback: rename the header in `cspHeaders()` back to `Content-Security-Policy-Report-Only`.
  - **The site must stay statically prerendered — no proxy/middleware for CSP** — which rules out nonces, so `script-src` uses `'unsafe-inline'` (experimental SRI doesn't cover inline RSC-payload scripts). Previews also allow the Vercel toolbar; dev adds `'unsafe-eval'`. `upgrade-insecure-requests` is omitted in dev because Safari upgrades `http://localhost` too (a local `next start` in Safari will still break on it).
  - **Keep the CSP in sync with the site:** any change that adds, removes, or moves a script, stylesheet, image/font host, fetch/websocket target, iframe, or third-party integration (analytics, Sentry, embeds) must update `cspHeaders()` and `src/__tests__/csp.test.ts` in the same change — and drop origins that are no longer used.
  - Reporting goes straight to Sentry's security endpoint (derived from `NEXT_PUBLIC_SENTRY_DSN`; no DSN → no reporting). Sentry ingests these as `csp` events at `error` level (accepted) and filters extension noise under Project Settings → Security Headers, where "Additional ignored sources" also drops blocked `eval` (bots and extensions; the site never uses eval in production). CSP reports bypass the SDK, so `beforeSend`/`ignoreErrors` can't filter them. A real `csp` event means something was **blocked**.
  - The `sentry_key` in the report URI is the public DSN key (already shipped in the client bundle) — exposing it is fine. No same-origin Sentry tunnel/proxy: losing reports from visitors whose ad blockers block `*.sentry.io` is an accepted risk.

### Testing conventions

- The test toolchain has a non-obvious dependency: `vitest.config.ts` uses `@vitejs/plugin-react` to transform JSX in `.tsx` test files, and `vite` is a required (non-optional) peer of vitest (still true as of v5) — so both `vite` and `@vitejs/plugin-react` must stay explicit `devDependencies`. If `vite` drops out of the tree (e.g. a lockfile regen), a clean `npm ci` leaves vitest unable to import it and `npm test` fails at startup with `ERR_MODULE_NOT_FOUND` — even though it may still pass locally on a stale `node_modules`.
- How to write tests (fixtures, mocks, env, timers, server-component rendering) is in `.claude/rules/testing.md`, which loads when you touch test files.

## Code Style

`README.md` is the public engineering write-up for anyone exploring how the site is built. Keep it current in the same change whenever the architecture, a decision or trade-off, the CI gates, an env var or a command changes. It stays matter-of-fact: no counts that go stale (tests, repos) and no GitHub account logins.

Keep code comments short — one brief line; point to CLAUDE.md or commit messages for rationale instead of explaining inline.

`prettier-plugin-tailwindcss` is active — Tailwind class order is enforced automatically, don't reorder manually.

Prettier isn't enforced by lint or CI: `eslint-config-prettier` only turns off conflicting rules, and there's no `format` script. Run `npx prettier --write <files>` on files you touch (that's also what applies the Tailwind class order). Several older files aren't Prettier-clean yet, so formatting a file you touch can add unrelated Tailwind class-order changes. That's expected; mention it in the commit message.

## Dependencies and bundle

**ESLint is held at 9 — don't bump to 10.** `eslint-plugin-react`, `-import` and `-jsx-a11y` cap their `eslint` peer at `^9`, and on 10 `eslint-plugin-react` crashes (`context.getFilename()` was removed), taking every `react/*` rule and `npm run build` down with it. Revisit when `eslint-plugin-react` > 7.37.5 ships. The guard is the `"eslint": "^9.39.5"` devDependency, and nothing else backs it up (no `overrides` entry). After any bump — the Next.js codemod rewrites it to an exact `9.39.5` — restore the caret and check that `npm ls eslint` shows 9.x. Bumping it to 10 is only ever the first step of a deliberate upgrade.

**TypeScript is held at 6** until `typescript-eslint` widens its `typescript <6.1.0` peer.

Sentry is wired across three runtimes via `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation-client.ts`. The shared subset (DSN, `debug`, `ignoreErrors`) lives in `sentry.shared-options.ts`, type-checked with `satisfies`, and is spread into each `init()` call — change it there to affect all three runtimes. `dataCollection` is left at Sentry 11's defaults on purpose: most of its categories never occur on a static site. Sentry 11 names the Vercel environments `production`/`preview` (no `vercel-` prefix), and `cspHeaders()` sends the same names. No runtime file overrides anything today; per-runtime keys (e.g. `tracesSampleRate`) would go in that runtime's file.

**Client bundle (audited 2026-10-29) — do not re-litigate.** What ships is the Next/React runtime, Sentry, the accepted `zod/mini` codec, and `next/image` for the avatar (about 7.7 KB). Nothing else is worth cutting:

- `next/image`: swapping the avatar to `getImageProps()` would drop it, but loses the automatic `priority` preload on the likely LCP image, so it was skipped.
- Sentry is the largest client chunk (~127 KB gzip) and loads eagerly via `instrumentation-client.ts`, already at Sentry's recommended minimum. The only lever Sentry recommends is tree-shaking (don't import unused integrations), and `init()` adds no integrations, so Session Replay, Browser Tracing, and Profiling are all excluded (verified: no replay/rrweb code ships).
- `bundleSizeOptimizations` (`excludeTracing`, `excludeDebugStatements`) are set in `next.config.ts` but are **no-ops under Turbopack** (our build) — Sentry's tree-shaking transforms only run on webpack. Keep them anyway so they activate automatically if Turbopack tree-shaking lands later; revisit this chunk after Next/Sentry upgrades.
- Do **not** suggest lazy-loading or deferring the core SDK `init()` to cut the bundle. Sentry recommends lazy-loading only for Session Replay (unused here), and deferring core init sacrifices early-error capture for a page that already paints instantly as static HTML.

## Verification

Match the check to the change:

- Unit logic — `npm test`
- Normal code edits — `npm run lint`
- Type-only changes (types, zod schemas, GraphQL documents) — `npm run typecheck`; lint doesn't typecheck
- Removing an export, dep, or file — `npm run knip` (CI fails on anything left unused)
- `knip --production` flags `src/csp.ts` (it only treats `next.config.ts` as an entry outside production mode) and test-only exports like `transformGithubUserToData` — expected, not dead code
- Runtime behavior, caching, Next config, Sentry wiring, or data fetching — `npm run build`
- Anything else (dependency or Next.js bumps, codegen, `ensureStatic`/`loading.tsx` probes, metadata, prefetch, CSP, bundle weight, browser/print checks, inspecting built output, GitHub probes): load the `verify-site` skill (`.claude/skills/verify-site/SKILL.md`).
