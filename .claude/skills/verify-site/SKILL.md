---
name: verify-site
description: How to verify a dhedegaard.dk change beyond test/lint/knip/build — dependency and Next.js bumps, codegen, ensureStatic and loading.tsx probes, metadata/JSON-LD, prefetch, CSP and production headers, client bundle weight, browser/print checks, inspecting built output, and ad-hoc GitHub probes. Use before claiming such a change works.
---

# Verifying dhedegaard.dk changes

The core checks (`npm test`, `npm run lint`, `npm run knip`, `npm run build`) are in CLAUDE.md. These cover the rest.

## What to run

- Dependency major bumps — watch `npm install` output for `ERESOLVE` peer warnings and inspect with `npm ls <pkg>`; the tree currently has no accepted mismatches, so any `ERESOLVE` warning indicates a problem.
- Next.js upgrades — `npx @next/codemod upgrade` fails under npm 12: it runs `npm view … --field version`, npm 12 rejects the unknown flag, and the codemod surfaces it as a misleading `Invalid revision provided`. Run it with npm 11 on PATH: `npx -y -p npm@11 -p @next/codemod@<ver> -c 'codemod upgrade <ver>'`, then restore the `eslint` caret (see `CLAUDE.md` → Dependencies and bundle).
- GitHub schema changes — `npm run codegen` (regenerates the git-ignored `github-schema.graphql` + `src/graphql-env.d.ts`; editing an existing query needs no regeneration)
- graphql / gql.tada bumps — `npx gql.tada generate-output` rebuilds `src/graphql-env.d.ts` from the local schema (no token/network); identical output means the bump is type-neutral. A full `npm run codegen` also pulls GitHub's upstream schema changes, so a schema diff there isn't caused by the bump.
- `ensureStatic` guard still enforced (after Next upgrades) — temporarily add `src/app/<probe>/page.tsx` that does `await connection()` inside `<Suspense>`; `npx next build` must fail with "must be fully static". Delete the probe afterwards, then run `npm run build` once: the failed build leaves `.next/types/validator.ts` pointing at the deleted page, which breaks `npm run typecheck` until the types regenerate.
- `loading.tsx` only shows during client navigation. To see it, temporarily add `src/app/<probe>/page.tsx` that renders `<Loading />` (imported from `../loading`), open it on the dev server, then delete it.
- Compare the skeleton with the page: on both `/` and the probe, at 375, 600 and 1280px, run `[...document.querySelector('.mt-10').parentElement.children].filter(e=>e.tagName!=='TEMPLATE'&&getComputedStyle(e).display!=='none').map(e=>Math.round(e.getBoundingClientRect().top+scrollY))`. The section tops should match. Three widths miss narrow bands: the Languages legend once wrapped differently only at 335–340, 375 and 470–580px. For a skeleton change, script the cached Playwright Chromium to compare the section heights at every width from 320 to 1280px.
- The Languages skeleton copies the live legend's item widths (`LEGEND_BONE_WIDTHS` in `language-stats.tsx`). When the legend's languages or counts change, re-measure them: `getBoundingClientRect().width` of each Languages `li` at 1280px, to one decimal, since rounding still shifts a wrap at 480 and 845px.
- Metadata / JSON-LD changes: `curl -s localhost:3000/` and parse the `<meta name="description">` tag and the `application/ld+json` script. `json-ld.test.ts` covers the JSON-LD and `SITE_DESCRIPTION`; nothing covers the rest of `layout.tsx`'s metadata.
- Prefetch / client-navigation changes — only observable in a production build (`npm run build`, then `npx next start -p <port>`). The 404 page's `<Link href="/">` is the site's only client navigation; its prefetch shows up as `/?_rsc=…` requests.
- Anything that loads a new external resource or integration — check `cspHeaders()` in `src/csp.ts` still allows it (and nothing stale remains), then `npm test`
- CSP headers locally — `NEXT_PUBLIC_SENTRY_DSN=<dummy> VERCEL_ENV=production npm run build`, then `npx next start -p <port>` and `curl -sI`; a dummy DSN gets baked into `.next`, so rebuild afterwards. Locally, `/_vercel/*` scripts 404 (Vercel serves them), which is not a CSP issue, and headless Chrome won't deliver Reporting API reports over http localhost. To check enforcement, load the page in a browser: CSP blocks show as console errors (`Refused to …`). With the dummy DSN, Sentry `envelope` requests return 400, which means they got through.
- Production headers — `curl -sI https://www.dhedegaard.dk/` (the apex 308-redirects to `www`, so curl it with `-L` or you'll see no CSP header)
- Vercel build log for a commit: get the URL from `gh api "repos/dhedegaard/dhedegaard.dk/deployments?sha=<sha>&environment=Production"`, then `…/deployments/<id>/statuses` (`environment_url`), then `vercel inspect <url> --logs`.
- The language legend is tuned to two lines at desktop width (848px `ul`, only about 65px to spare on the first line). After changing legend text, emulate 1280×900 and count the distinct `li` top offsets with `javascript_tool`. The pane resets the emulated size whenever its width changes, so re-set it before measuring.
- Client JS weight: `grep -o '/_next/static/[^"]*\.js' .next/server/app/index.html | sort -u | sed 's|^/_next/|.next/|' | xargs -I{} sh -c 'gzip -9c {} | wc -c' | awk '{s+=$1} END {print s}'`. Compare it before and after any change that adds client code. The total includes Next's polyfill chunk (the `<script noModule>` one, about 39 KB gzip), which modern browsers skip; leave it out when comparing.
- Per-source client-bundle attribution: `npx next analyze --output --snapshot <name>`, then `npx next analyze export --snapshot <name> | gzip > <scratch>.jsonl.gz`. The export has `part` records with `[client-fs]` filenames and a per-source `compressed_size`. Use distinct snapshot names for before and after a change.
- A failing `npm run build` may be the lint leg, not your change — check the `[build]`/`[lint]` output prefix, and reproduce on a clean tree before attributing it to your edit.

## Inspecting output and data

- Rendered output after `npm run build`: grep `.next/server/app/index.html` and `index.rsc` to confirm what ships (e.g. no GitHub account logins), and measure size with `gzip -9c <file> | wc -c`.
- When scanning built HTML for phone numbers, strip the tags first. Digit runs in icon SVG `path` data match 8-digit patterns and are false positives.
- Language bar shares on production or the dev server: `curl -sL https://www.dhedegaard.dk/ | grep -o 'aria-label="Language share:[^"]*"'`. The "Other" names are in the last legend item's `title`.
- Full language ranking (beyond what the page ships): a scratchpad `.mts` script that imports `getGithubUser` from `src/clients/github` and recomputes the shares, run with `set -a; source ./.env; set +a; npx -y tsx <file>.mts`. It must be `.mts`, since tsx's CJS output rejects top-level `await`.
- Ad-hoc GitHub GraphQL probes: build the body with `jq -n --arg … > q.json`, then `(source ./.envrc && curl -s -H "Authorization: bearer $GITHUB_PAT" -X POST -d @q.json https://api.github.com/graphql) | jq …`. Print only aggregates, never the token or private repo names.
- On production, Vercel Analytics/Speed Insights load from hashed same-origin paths (e.g. `/ce77bbabbf5abf1f/script.js`), not `/_vercel/*`. `'self'` already covers them, so don't add Vercel origins for them.
- Preview deployments (`dhedegaard-dk-git-<branch>-d-hedegaard.vercel.app`) are behind Vercel Deployment Protection (`curl` gets a 302), so check their headers in a logged-in browser or on production.

## Tooling quirks

- In `next dev`, the console shows CSP `Loading the script … violates` errors for Vercel Analytics/Speed Insights debug scripts from `va.vercel-scripts.com`. This is dev-only and expected; production serves them same-origin.
- `next dev` can show a server error from an earlier render (e.g. a query/schema mismatch mid-edit) in the browser console even after a reload. Check the current state with `curl -s localhost:3000/ | grep …` before chasing it.
- While Claude's browser pane is hidden, the page runs as a background page and `requestAnimationFrame` never fires. React then never reveals the page's streamed Suspense boundary, so nothing below the layout hydrates. Check `tabs_context`, or script the cached Playwright Chromium (`~/Library/Caches/ms-playwright/chromium-*/…/Google Chrome for Testing`) with `playwright-core` from the scratchpad. Switching the heatmap shows one favicon request per URL change: Chrome refetches the Gravatar icon, and the app fetches no data.
- In Claude's browser pane, dark-mode emulation renders a dark canvas behind black text. Emulate a light colour scheme before visual checks.
- Claude's browser pane is narrower than `md` (~760px), so by default it shows the mobile layout. Emulate 1280×900 for desktop and the mobile preset for phones, reloading after each switch.
- The `scrollbar-gutter` reservation doesn't show in `innerWidth - document.documentElement.clientWidth`; compare `document.body.getBoundingClientRect().width` with and without the rule.
- Print media: the browser pane can't emulate print. Script the cached Playwright Chromium with `playwright-core`, call `page.emulateMedia({ media: 'print' })`, and list the visible `h2`s (`offsetParent !== null`). For the real layout, run `npm run build` and `npx next start -p 3100`, render `page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: false })` and Read the PDF: expect two pages, no split entries and a coloured language bar. Safari lays text out a little taller than Chromium, so keep page 2 well short of full: Experience plus Education measured about 930 of the page's 1009 CSS px in Chromium (2026-11-07), and at 992 Safari spilled onto a third page. `printBackground: false` matches the dialog's default; badges and the bar still print in colour.
- Safari/WebKit: Playwright's cache has no WebKit, so Claude can't render in it. For Safari-only layout bugs, check in headless Chromium, then ask the user to open the dev server in Safari.
