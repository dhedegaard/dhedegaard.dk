import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ContributionCalendar } from '../../fetchers/contribution-calendar'
import { ContributionHeatmap } from '../contribution-heatmap'

const render = (calendar: ContributionCalendar | null) =>
  renderToStaticMarkup(createElement(ContributionHeatmap, { calendar }))

// Monday 2026-10-12 to Sunday 2026-10-18, then Monday 2026-10-19 alone.
const calendar: ContributionCalendar = {
  accountCount: 2,
  total: 1325,
  activeDays: 3,
  weeks: [
    [
      { date: '2026-10-12', count: 1234, level: 4 },
      { date: '2026-10-13', count: 1, level: 1 },
      { date: '2026-10-14', count: 0, level: 0 },
      { date: '2026-10-15', count: 0, level: 0 },
      { date: '2026-10-16', count: 90, level: 3 },
      { date: '2026-10-17', count: 0, level: 0 },
      { date: '2026-10-18', count: 0, level: 0 },
    ],
    [{ date: '2026-10-19', count: 0, level: 0 }, null, null, null, null, null, null],
  ],
  months: [{ week: 1, label: 'Oct' }],
}

describe('ContributionHeatmap', () => {
  it('renders nothing without a calendar', () => {
    expect(render(null)).toBe('')
  })

  it('shows the exact count for each day on hover', () => {
    const markup = render(calendar)

    expect(markup).toContain('title="1,234 contributions on Mon, 12 Oct 2026"')
    expect(markup).toContain('title="1 contribution on Tue, 13 Oct 2026"')
    expect(markup).toContain('title="No contributions on Wed, 14 Oct 2026"')
  })

  it('puts Monday in the first row and Sunday in the last', () => {
    const markup = render(calendar)

    expect(markup).toMatch(/style="grid-column:1;grid-row:2"[^>]*title="[^"]*Mon, 12 Oct/)
    expect(markup).toMatch(/style="grid-column:1;grid-row:8"[^>]*title="[^"]*Sun, 18 Oct/)
    expect(markup).toMatch(/style="grid-column:2;grid-row:2"[^>]*title="[^"]*Mon, 19 Oct/)
  })

  it('labels Monday, Wednesday and Friday on the rows of those days', () => {
    // Row 1 holds the month labels, so Monday is row 2.
    const markup = render(calendar)

    expect(markup).toMatch(/<span class="row-start-2[^"]*">Mon<\/span>/)
    expect(markup).toMatch(/<span class="row-start-4[^"]*">Wed<\/span>/)
    expect(markup).toMatch(/<span class="row-start-6[^"]*">Fri<\/span>/)
  })

  it('renders no square for an empty slot', () => {
    expect(render(calendar).match(/title="/g)).toHaveLength(8)
  })

  it('shades each day by its level', () => {
    const markup = render(calendar)

    expect(markup).toMatch(/bg-\[#216e39\][^>]*title="1,234 contributions/)
    expect(markup).toMatch(/bg-\[#ebedf0\][^>]*title="No contributions on Wed/)
  })

  it('labels a month above the week it starts in', () => {
    expect(render(calendar)).toMatch(/<span[^>]*style="grid-column:2;grid-row:1"[^>]*>Oct<\/span>/)
  })

  it('summarises the year for screen readers', () => {
    expect(render(calendar)).toContain(
      'role="img" aria-label="1,325 contributions over the past year, on 3 days"'
    )
  })

  it('uses the singular in the summary for one contribution on one day', () => {
    expect(render({ ...calendar, total: 1, activeDays: 1 })).toContain(
      'aria-label="1 contribution over the past year, on 1 day"'
    )
  })

  it('only scrolls below md, so a scrollbar never pushes the rows out of line with their labels', () => {
    expect(render(calendar)).toMatch(/class="[^"]*overflow-x-auto[^"]*md:overflow-x-visible/)
  })

  it('says the calendar combines personal and work accounts', () => {
    expect(render(calendar)).toContain(
      'Contributions over the past year across my personal and work GitHub accounts, private repos included.'
    )
  })

  it('drops the personal and work wording for a single account', () => {
    expect(render({ ...calendar, accountCount: 1 })).toContain(
      'Contributions over the past year on GitHub, private repos included.'
    )
  })

  it('shows a legend from less to more', () => {
    expect(render(calendar)).toMatch(/Less.*bg-\[#ebedf0\].*bg-\[#216e39\].*More/)
  })
})
