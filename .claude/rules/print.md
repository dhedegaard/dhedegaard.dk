---
paths:
  - "src/styles/globals.css"
  - "src/app/page.tsx"
  - "src/app/page-header.tsx"
  - "src/app/about-me-sections.tsx"
  - "src/app/print-stamp.tsx"
  - "src/app/find-me-element.tsx"
  - "src/app/tech-stack.tsx"
  - "src/app/language-stats.tsx"
---

# Print

`print:` variants plus `@page` (A4) in `src/styles/globals.css`; no print-only components except `print-stamp.tsx` (a "From dhedegaard.dk · <month>" line under the location, dated by the deployment, else `now`).

- Hidden in print: the heatmap, the repositories and the footer (`print:hidden`, tested). The tech stack and language bar always print; badges and the bar keep their colours via one `print-color-adjust: exact` rule on `html` in `src/styles/globals.css`.
- `FindMeElement` prints as blue icon-plus-target text (`github.com/…`, the email) instead of buttons; LinkedIn is `print:hidden`. Only the copy under the avatar prints; the avatar column widens to fit it (`print:w-auto`), beside the name, tagline and tech stack.
- Page breaks: each job/degree `<article>` and the tech stack and bar are `print:break-inside-avoid`; `HeadedList` in `about-me-sections.tsx` wraps each heading with its first entry (Firefox ignores `break-after: avoid`).
- An A4 page is about 673 CSS px wide, below `md`, so `max-md:` classes apply in print and `md:` ones don't. Tailwind v4 emits `print:` rules after the breakpoint rules, so a `print:` class always overrides them.
- Tailwind's build (Lightning CSS) adds the `-webkit-` prefix itself, e.g. for `print-color-adjust`. Don't add prefixed classes by hand.
- The print margins of About/Experience/Education are set in `page.tsx`; the last printed section has `print:mb-0`, or its margin spills onto a blank third page.
