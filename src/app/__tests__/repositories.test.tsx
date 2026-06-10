import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { DataRepository } from '../../fetchers/data-action'
import { Repositories } from '../repositories'

const makeRepository = (overrides: Partial<DataRepository> = {}): DataRepository => ({
  id: 'repo-1',
  name: 'my-project',
  url: 'https://github.com/dhedegaard/my-project',
  pinned: false,
  description: 'A cool project',
  homepageUrl: null,
  pushedAt: '2024-01-01T00:00:00Z',
  stargazerCount: 0,
  languages: [],
  topics: [],
  ...overrides,
})

const render = (repositories: DataRepository[]) =>
  renderToStaticMarkup(createElement(Repositories, { repositories }))

describe('Repositories', () => {
  it('renders the heading and each repository name linking to its url', () => {
    const markup = render([
      makeRepository({ id: 'a', name: 'alpha', url: 'https://github.com/dhedegaard/alpha' }),
      makeRepository({ id: 'b', name: 'beta', url: 'https://github.com/dhedegaard/beta' }),
    ])

    expect(markup).toContain('Open source projects')
    expect(markup).toContain('alpha')
    expect(markup).toContain('href="https://github.com/dhedegaard/alpha"')
    expect(markup).toContain('beta')
    expect(markup).toContain('href="https://github.com/dhedegaard/beta"')
  })

  it('shows the star count with a pluralized label above one', () => {
    const markup = render([makeRepository({ stargazerCount: 42 })])

    expect(markup).toContain('42')
    expect(markup).toContain('42 stargazers')
  })

  it('uses the singular star label for exactly one star', () => {
    const markup = render([makeRepository({ stargazerCount: 1 })])

    expect(markup).toContain('1 stargazer')
    expect(markup).not.toContain('1 stargazers')
  })

  it('hides the star indicator when there are no stars', () => {
    const markup = render([makeRepository({ stargazerCount: 0 })])

    expect(markup).not.toContain('stargazer')
  })

  it('renders the pinned indicator only when pinned', () => {
    expect(render([makeRepository({ pinned: true })])).toContain('aria-label="Pinned"')
    expect(render([makeRepository({ pinned: false })])).not.toContain('aria-label="Pinned"')
  })

  it('renders a formatted homepage link when present and omits it when null', () => {
    const withHome = render([makeRepository({ homepageUrl: 'https://example.com/docs' })])
    expect(withHome).toContain('href="https://example.com/docs"')
    expect(withHome).toContain('example.com/docs')

    expect(render([makeRepository({ homepageUrl: null })])).not.toContain('example.com')
  })

  it('renders topic badges', () => {
    const markup = render([
      makeRepository({
        topics: [
          { id: 't1', name: 'typescript' },
          { id: 't2', name: 'nextjs' },
        ],
      }),
    ])

    expect(markup).toContain('typescript')
    expect(markup).toContain('nextjs')
  })

  it('joins language names with commas', () => {
    const markup = render([
      makeRepository({
        languages: [
          { id: 'l1', name: 'TypeScript', color: '#3178c6' },
          { id: 'l2', name: 'CSS', color: '#563d7c' },
        ],
      }),
    ])

    expect(markup).toContain('Language(s):')
    expect(markup).toContain('TypeScript, CSS')
  })

  it('renders the description with a matching title attribute', () => {
    const markup = render([makeRepository({ description: 'Neat thing' })])

    expect(markup).toContain('Neat thing')
    expect(markup).toContain('title="Neat thing"')
  })
})
