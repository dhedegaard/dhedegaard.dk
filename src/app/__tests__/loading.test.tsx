import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Loading from '../loading'
import { SITE_NAME } from '../site-meta'

const render = () => renderToStaticMarkup(createElement(Loading))
const headings = (markup: string) =>
  [...markup.matchAll(/<h[12][^>]*>([^<]*)<\/h[12]>/g)].map((match) => match[1])

// Top-level on-screen components in a file's JSX (conditional ones too), in render order.
// Print-only ones (`className="hidden …`) are skipped.
const sectionsOf = (file: string) =>
  [
    ...readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').matchAll(
      /^ {6}(?:\{\w+ && )?<([A-Z]\w*)(.*)$/gm
    ),
  ]
    .filter((match) => !(match[2] ?? '').includes('className="hidden'))
    .map((match) => match[1] ?? '')

// Below everything the skeleton covers.
const PAGE_ONLY = new Set(['SiteFooter'])

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Loading', () => {
  it('has a skeleton for every on-screen section of the page, in the same order', () => {
    const page = sectionsOf('page.tsx').filter((name) => !PAGE_ONLY.has(name))
    const skeleton = sectionsOf('loading.tsx').map((name) => name.replace(/Skeleton$/, ''))

    // Guards against the source scan silently matching nothing.
    expect(page).toContain('LanguageStats')
    expect(skeleton).toEqual(page)
  })

  it('shows the real static content and headings', () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat')

    expect(headings(render())).toEqual([
      SITE_NAME,
      'Tech stack',
      'Languages',
      'Activity',
      'Open source projects',
    ])
  })

  it('leaves out Activity without contribution accounts, like the page', () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', '')

    expect(headings(render())).not.toContain('Activity')
  })

  it('hides placeholder text from screen readers', () => {
    const spans = [...render().matchAll(/<span[^>]*text-transparent[^>]*>/g)].map(([span]) => span)

    expect(spans.length).toBeGreaterThan(0)
    for (const span of spans) {
      expect(span).toContain('aria-hidden="true"')
    }
  })
})
