---
paths:
  - "src/fetchers/compute-language-stats.ts"
  - "src/fetchers/__tests__/github-data.test.ts"
  - "src/app/language-stats.tsx"
  - "src/app/__tests__/language-stats.test.tsx"
---

# Language stats

`computeLanguageStats` in `src/fetchers/compute-language-stats.ts` (tested through `transformGithubUserToData`), rendered by `language-stats.tsx`:

- Each non-archived, non-fork repo weighs equally, split by byte share (each language's `size` over the sum of the repo's language sizes), so one large repo can't dominate.
- Markup, data, docs, build, style and shell formats (`NON_PROGRAMMING_LANGUAGES`: HTML, CSS, SCSS, Markdown, JSON, YAML, Dockerfile, Makefile, CMake, Shell) are left out before the shares are taken, so a repo with only those doesn't count.
- Up to 10 languages with at least a 1% share are shown, each with how many repos use it, and the rest fold into "Other" (no repo count).
- The skeleton's legend bones use the live legend's measured item widths (`LEGEND_BONE_WIDTHS`), so it wraps like the real legend at every width. Re-measure them when the legend changes (see the `verify-site` skill).
- Archived repos, forks and the excluded formats are left out of the stats only; they're still listed, and repo cards still show every language.
