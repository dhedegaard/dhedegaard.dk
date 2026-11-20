---
paths:
  - "src/app/*heatmap*"
  - "src/app/contribution-heatmap.tsx"
  - "src/app/activity-section.tsx"
  - "src/app/years-param.ts"
  - "src/app/page.tsx"
  - "src/clients/github.ts"
  - "src/css-vars.d.ts"
  - "src/fetchers/contribution-calendar.ts"
  - "src/fetchers/heatmap-windows.ts"
  - "src/clients/contributions-query.ts"
---

# Activity heatmap

One 12-month window at a time, newest first.

- Fetching: `getHeatmapWindows(now)` (in `heatmap-windows.ts`) anchors the windows on `now`'s UTC date, read inside `page.tsx`'s `'use cache'` scope. Windows are contiguous, back to the earliest of the accounts' `contributionYears`. It fetches window 0 for every account first, then only the older windows each account was active in, at most 6 requests at a time. `postGithubQuery` retries a transient failure once and times each request out after 10 s, and the older windows have a 25 s budget to stay inside Next's 50 s prerender limit.
- Shaping: `buildHeatmapWindow` (in `contribution-calendar.ts`) sums the accounts' daily counts per window and precomputes each window's quartile thresholds, so each window is shaded on its own scale. Middle windows without data stay as zeros, so the numbering never shifts, and trailing empty windows are dropped.
- Failure: if window 0 fails for any account, or `GITHUB_CONTRIBUTION_ACCOUNTS` is unset or invalid, the section hides (failures go to Sentry) while the rest of the page renders. An older failure only cuts the history short. That's why it's a separate request, kept out of `getGithubData()` (so the sitemap doesn't fetch it): `postGithubQuery` throws on any GraphQL error, so a bad login inside the main query would take the whole page down.
- Client: `contribution-heatmap.tsx` is the site's one stateful client component. It reads `?years=N` with `useSyncExternalStore` and the `yearsParam` `zod/mini` codec (`years-param.ts`, the only zod in the browser; its cost is accepted, see the `zod/mini` convention in CLAUDE.md), and writes it with `history.replaceState`. The server never reads the param, so the static HTML always shows window 0, and the controls (`heatmap-controls.tsx`) stay `invisible` until hydration. `heatmap-grid.tsx` and `heatmap-layout.ts` are hook-free and zod-free.
- Grid: each window starts on its own first day, so week 0 is padded with empty slots in Monday-first weeks. The weekday labels are a sticky column inside the cell grid, sharing its rows via `grid-rows-subgrid`, so they line up at every width without matching track sizes by hand. Every track is sized explicitly from `--cell` (11px on phones; from `md` up, the `@container` wrapper's `100cqi` minus the label column and gaps, divided by `--weeks`, but never below 11px, so narrow tablets scroll like phones). Don't switch back to `aspect-square` cells in `auto` rows against `1fr` columns: Safari sizes those rows wrongly, so the cells stretch tall and the grid overflows.
