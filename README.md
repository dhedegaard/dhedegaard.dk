# dhedegaard.dk

[![CI](https://github.com/dhedegaard/dhedegaard.dk/actions/workflows/ci.yml/badge.svg)](https://github.com/dhedegaard/dhedegaard.dk/actions/workflows/ci.yml)

The source of [dhedegaard.dk](https://www.dhedegaard.dk), my personal site.

The site is meant to stay current without me maintaining any content. It's built from my GitHub account: the open-source projects, the Languages bar, and an Activity heatmap you can step back through year by year. When I push a new project or start using a new language, the site picks it up within the hour. The only hand-written parts are the tagline and the tech stack.

## How it works

1. **Fetch.** Typed GraphQL queries ([`src/clients`](src/clients)) ask the GitHub API for my profile, my public repositories and my contribution calendar.
2. **Validate.** Every response is parsed with [zod](https://zod.dev) (`zod/mini`) before anything uses it, so a change on GitHub's side fails loudly instead of rendering something wrong.
3. **Shape.** Pure functions ([`src/fetchers`](src/fetchers)) turn the response into what the page shows:
   - repositories sorted by pinned, stars and recent activity
   - language shares that weight every repository equally, so one large repo can't dominate
   - contributions summed into contiguous 12-month windows
4. **Render.** A fully prebuilt [Next.js](https://nextjs.org) page (App Router, Cache Components) that refreshes hourly. The heatmap is the only interactive part: switching years is a client component that keeps its state in the URL (`?years=N`), while the server never reads the URL. A footer line shows when the site was deployed and from which commit (from Vercel's `VERCEL_GIT_COMMIT_SHA`), and when the cached data was generated. Both are shown in UTC, since a prebuilt page can't follow the visitor's timezone.

## Decisions and trade-offs

A site that maintains itself has to fail safely, because nobody is watching it day to day. Most of the decisions below follow from that.

- **Static, so the CSP can be strict.** The page is prebuilt and served as a static file, and the root layout makes the build fail on any request-time work. That's what lets [`src/csp.ts`](src/csp.ts) enforce a Content Security Policy that reports violations to Sentry. The trade-off: there's no server at request time to issue per-request nonces, so `script-src` allows inline scripts, the ones Next.js uses to hydrate the page.
- **Validate at every boundary.** GitHub responses, the configured contribution accounts and the `?years` URL parameter all go through zod schemas, and the types come from those schemas. The GraphQL types come from [gql.tada](https://gql-tada.0no.co) and are checked against the zod schemas in both directions, so the query and the schema can't drift apart unnoticed.
- **Contain failures.**
  - The heatmap is fetched apart from the rest of the page, so a failure hides only the heatmap.
  - If an older year fails, the history is cut short instead of failing the whole heatmap.
  - Transient GitHub errors are retried once, and every request has a timeout.
  - The page cache expires after 30 days, so a broken token or a GitHub outage leaves the last good page in place for weeks. Errors go to Sentry.
- **Costs I've accepted, on purpose.**
  - The Sentry browser SDK is the largest client chunk. It already runs with no optional integrations (no Session Replay, no tracing), and loading it lazily would lose early errors.
  - The heatmap's URL parameter is validated with zod in the browser too, which costs more bundle than it should because Turbopack doesn't yet tree-shake `zod/mini` well.

## How it's kept correct

- **TypeScript at its strictest** ([`@tsconfig/strictest`](https://github.com/tsconfig/bases)), plus [typescript-eslint](https://typescript-eslint.io)'s type-aware `strictTypeChecked` rules.
- **CI gates on every push** ([`ci.yml`](.github/workflows/ci.yml)):
  - unit tests
  - a production build, which also typechecks and lints
  - [knip](https://knip.dev), to catch unused files, exports and dependencies
- **Tests** ([Vitest](https://vitest.dev)) target the logic that decides what you see:
  - Data shaping is a set of pure functions tested directly, without mocking the network.
  - Components are rendered to HTML on the server and checked as markup.
  - The GitHub client is tested against a stubbed `fetch`.
- **The [React Compiler](https://react.dev/learn/react-compiler)** handles memoisation, so components stay plain React.

## Running it locally

You need Node 24, npm 11 or later, and a GitHub token.

```bash
npm ci
npm run dev
```

Environment variables, in `.env`:

| Variable                       | Required | Purpose                                                                                                                   |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_PAT`                   | yes      | A classic token with the `public_repo` and `read:user` scopes. It's used at build time and to generate the GraphQL types. |
| `GITHUB_CONTRIBUTION_ACCOUNTS` | no       | Comma-separated GitHub logins whose contributions are summed into the heatmap. Unset hides the heatmap.                   |
| `NEXT_PUBLIC_SENTRY_DSN`       | no       | Error and CSP reporting.                                                                                                  |

Other commands:

| Command                              | Does                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| `npm test`                           | Unit tests                                             |
| `npm run build`                      | Production build, which typechecks and lints alongside |
| `npm run lint` / `npm run typecheck` | Lint or typecheck on their own                         |
| `npm run knip`                       | Find unused files, exports and dependencies            |
| `npm run codegen`                    | Regenerate the GitHub schema and GraphQL types         |

## License

The code is [MIT licensed](LICENSE).

The personal content is not covered by that licence and stays all rights reserved:

- my name and photo, including the icons in [`public/icons`](public/icons)
- the tagline, tech stack and contact links
- the site's descriptions and metadata, in [`layout.tsx`](src/app/layout.tsx) and [`manifest.json`](public/manifest.json)

If you build on this, replace them with your own.
