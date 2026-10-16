import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { HeatmapWindow } from '../../fetchers/contribution-calendar'
import { ContributionHeatmap } from '../contribution-heatmap'

const render = (windows: readonly HeatmapWindow[] | null) =>
  renderToStaticMarkup(createElement(ContributionHeatmap, { windows }))

const period = (start: string, total: number): HeatmapWindow => ({
  start,
  counts: [total, ...Array.from({ length: 364 }, () => 0)],
  thresholds: [total],
  total,
  activeDays: 1,
})

const windows = [period('2025-10-17', 7), period('2024-10-17', 3), period('2023-10-17', 2)]

describe('ContributionHeatmap', () => {
  it('renders nothing without windows', () => {
    expect(render(null)).toBe('')
    expect(render([])).toBe('')
  })

  it('renders the Activity heading and the latest window', () => {
    const markup = render(windows)

    expect(markup).toContain('>Activity</h2>')
    expect(markup).toContain('aria-label="7 contributions over the past year, on 1 day"')
  })

  it('renders the latest window with the controls hidden before hydration', () => {
    const markup = render(windows)

    expect(markup).toMatch(/<div role="group" aria-label="Activity period" class="[^"]*invisible/)
    expect(markup).toMatch(/role="status"[^>]*>Past 12 months</)
    expect(markup).toContain('role="img" aria-label="7 contributions over the past year, on 1 day"')
  })
})
