---
paths:
  - "src/**/__tests__/**"
  - "vitest.config.ts"
---

# Testing conventions

- `transformGithubUserToData` (in `github-data.ts`) is the pure, sync extraction of all data-shaping logic. Test data transformations through it directly rather than mocking `fetch`.
- Use `renderToStaticMarkup` + `createElement` (from `react-dom/server`) to test server component output without a DOM environment. Client components render their server snapshot there (`useSyncExternalStore`'s third argument). Verify interaction in the browser.
- Use `vi.stubGlobal('fetch', vi.fn(...))` to mock network calls in `github.ts` tests; restore with `vi.unstubAllGlobals()` in `afterEach`.
- Env-driven code: `vi.stubEnv(...)`, restored with `vi.unstubAllEnvs()` in `afterEach`. `vi.mock` of `../../clients/github` or `@sentry/nextjs` hoists file-wide, so keep module mocks in their own test file (see `heatmap-windows.test.ts`).
- Fake timers: `vi.useFakeTimers()` doesn't fake `AbortSignal.timeout`, so spy on it. For a promise that should reject, attach `expect(p).rejects…` before `vi.advanceTimersByTimeAsync`, or vitest reports an unhandled rejection.
- Vitest 5 defaults to `clearMocks: true` — don't add `vi.clearAllMocks()` in `afterEach`; spies still need `mockRestore()`.
- Test factory functions (`makeRepository`, `makeUser`) require explicit `id` fields — no auto-generated fallbacks.
- Language-stats fixtures: tied shares sort by name (`localeCompare`), so use single letters (`'A'…'L'`), not `L0…L11` ("L10" sorts before "L2"). Don't use names in `NON_PROGRAMMING_LANGUAGES` (HTML, CSS, Shell, …) as stand-ins for real languages.
- To render a component that requires `children` in a test, use JSX in the `.tsx` test (`<C prop={…}><button /></C>`): `createElement(C, { children })` fails `react/no-children-prop`, and passing children as the third argument fails the typecheck.
