import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { HeatmapWindow } from '../../fetchers/contribution-calendar'
import { HeatmapGrid } from '../heatmap-grid'

const render = (period: HeatmapWindow, latest = true) =>
  renderToStaticMarkup(createElement(HeatmapGrid, { period, latest }))

// Monday 2026-10-12 to Sunday 2026-10-18, then Monday 2026-10-19 alone.
const period: HeatmapWindow = {
  start: '2026-10-12',
  counts: [1234, 1, 0, 0, 90, 0, 0, 0],
  thresholds: [1, 50, 100],
  accountCount: 2,
  total: 1325,
  activeDays: 3,
}

describe('HeatmapGrid', () => {
  it('shows the exact count for each day on hover', () => {
    const markup = render(period)

    expect(markup).toContain('title="1,234 contributions on Mon, 12 Oct 2026"')
    expect(markup).toContain('title="1 contribution on Tue, 13 Oct 2026"')
    expect(markup).toContain('title="No contributions on Wed, 14 Oct 2026"')
  })

  it('puts each week in its own column, Monday first', () => {
    // Column 1 holds the weekday labels, so week 0 is column 2.
    const markup = render(period)

    expect(markup).toMatch(
      /style="grid-column:2"><span class="row-start-1 [^"]*" title="[^"]*Mon, 12 Oct[^"]*"/
    )
    expect(markup).toMatch(/class="row-start-7 [^"]*" title="[^"]*Sun, 18 Oct/)
    expect(markup).toMatch(
      /style="grid-column:3"><span class="row-start-1 [^"]*" title="[^"]*Mon, 19 Oct[^"]*"/
    )
  })

  it('puts a window that starts mid-week on its weekday row', () => {
    // Thursday 15 Oct is the fourth row.
    expect(render({ ...period, start: '2026-10-15' })).toMatch(
      /style="grid-column:2"><span class="row-start-4 [^"]*" title="[^"]*Thu, 15 Oct[^"]*"/
    )
  })

  it('labels Monday, Wednesday and Friday on the rows of those days', () => {
    // Row 1 holds the month labels, so Monday is row 2.
    const markup = render(period)

    expect(markup).toMatch(/<span class="row-start-2[^"]*">Mon<\/span>/)
    expect(markup).toMatch(/<span class="row-start-4[^"]*">Wed<\/span>/)
    expect(markup).toMatch(/<span class="row-start-6[^"]*">Fri<\/span>/)
  })

  it('renders no square for an empty slot', () => {
    expect(render(period).match(/title="/g)).toHaveLength(8)
  })

  it('shades each day by its level', () => {
    const markup = render(period)

    expect(markup).toMatch(/bg-\[#216e39\][^>]*title="1,234 contributions/)
    expect(markup).toMatch(/bg-\[#ebedf0\][^>]*title="No contributions on Wed/)
  })

  it('labels a month above the week it starts in', () => {
    // 1 Oct 2026 is in week 1 when the window starts on Monday 21 Sep.
    const september: HeatmapWindow = {
      ...period,
      start: '2026-09-21',
      counts: Array.from({ length: 21 }, () => 0),
    }

    expect(render(september)).toMatch(/<span[^>]*style="grid-column:3;grid-row:1"[^>]*>Oct<\/span>/)
  })

  it('summarises the year for screen readers', () => {
    expect(render(period)).toContain(
      'role="img" aria-label="1,325 contributions over the past year, on 3 days"'
    )
  })

  it('keeps the weekday labels in view while the weeks scroll', () => {
    expect(render(period)).toMatch(/<div class="sticky left-0 [^"]*">.*?>Mon</)
  })

  it('says the calendar combines personal and work accounts', () => {
    expect(render(period)).toContain(
      'Contributions over the past year across my personal and work GitHub accounts, private repos included.'
    )
  })

  it('describes an earlier window by its dates', () => {
    const markup = render(period, false)

    expect(markup).toContain(
      'aria-label="1,325 contributions from 12 Oct 2026 to 19 Oct 2026, on 3 days"'
    )
    expect(markup).toContain(
      'Contributions from 12 Oct 2026 to 19 Oct 2026 across my personal and work GitHub accounts'
    )
  })

  it('shows a legend from less to more', () => {
    expect(render(period)).toMatch(/Less.*bg-\[#ebedf0\].*bg-\[#216e39\].*More/)
  })
})
