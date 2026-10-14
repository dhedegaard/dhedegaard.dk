import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { LanguageStats as LanguageStatsData } from '../../fetchers/data-action'
import { LanguageStats } from '../language-stats'

const render = (stats: LanguageStatsData) =>
  renderToStaticMarkup(createElement(LanguageStats, { stats }))

const stats: LanguageStatsData = {
  repoCount: 23,
  top: [
    { name: 'TypeScript', color: '#3178c6', share: 0.347, repoCount: 12 },
    { name: 'Rust', color: null, share: 0.149, repoCount: 3 },
  ],
  other: null,
}

describe('LanguageStats', () => {
  it('renders nothing when no repository contributes', () => {
    expect(render({ repoCount: 0, top: [], other: null })).toBe('')
  })

  it('lists each language with a one-decimal percentage', () => {
    const markup = render(stats)

    expect(markup).toContain('Languages')
    expect(markup).toMatch(/<li[^>]*>.*?TypeScript<span[^>]*>34\.7%</)
    expect(markup).toMatch(/<li[^>]*>.*?Rust<span[^>]*>14\.9%</)
  })

  it('describes the bar for screen readers', () => {
    expect(render(stats)).toContain(
      'role="img" aria-label="Language share: TypeScript 34.7%, Rust 14.9%"'
    )
  })

  it('uses the GitHub language color, with a fallback when it is missing', () => {
    const markup = render(stats)

    expect(markup).toContain('background-color:#3178c6')
    expect(markup).toContain('bg-slate-400')
  })

  it('folds the remaining languages into other, naming them in a tooltip', () => {
    const markup = render({ ...stats, other: { share: 0.05, names: ['Lua', 'Shell'] } })

    expect(markup).toMatch(/title="Lua, Shell"[^>]*>.*Other.*5\.0%/)
    expect(markup).toContain('Other 5.0%"')
  })

  it('states how many repositories the stats cover', () => {
    expect(render(stats)).toContain('23 repos')
    expect(render({ ...stats, repoCount: 1 })).toContain('1 repo ')
  })
})
