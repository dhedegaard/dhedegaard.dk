import { describe, expect, it } from 'vitest'
import type { GithubContributions } from '../../clients/github'
import {
  buildHeatmapWindow,
  computeContributionCalendar,
  oldestWindowIndex,
  parseContributionAccounts,
  windowBounds,
  windowOverlapsYears,
} from '../contribution-calendar'

// One account's calendar from a date → count map; GitHub's week grouping is irrelevant here.
const account = (counts: Record<string, number>): GithubContributions => ({
  contributionsCollection: {
    contributionCalendar: {
      weeks: [
        {
          contributionDays: Object.entries(counts).map(([date, contributionCount]) => ({
            date,
            contributionCount,
          })),
        },
      ],
    },
  },
})

// Consecutive dates from an ISO start date, each with the given count.
const daysFrom = (start: string, counts: readonly number[]): Record<string, number> =>
  Object.fromEntries(
    counts.map((count, index) => {
      const date = new Date(`${start}T00:00:00Z`)
      date.setUTCDate(date.getUTCDate() + index)
      return [date.toISOString().slice(0, 10), count]
    })
  )

describe('computeContributionCalendar', () => {
  it('adds the accounts together day by day', () => {
    const calendar = computeContributionCalendar([
      account({ '2026-10-12': 2 }),
      account({ '2026-10-12': 3 }),
    ])

    expect(calendar?.weeks[0]?.[0]).toMatchObject({ date: '2026-10-12', count: 5 })
    expect(calendar?.total).toBe(5)
  })

  it('keeps a day that only one account reports', () => {
    const calendar = computeContributionCalendar([
      account({ '2026-10-12': 2 }),
      account({ '2026-10-12': 0, '2026-10-13': 1 }),
    ])

    expect(calendar?.weeks[0]?.[1]).toMatchObject({ date: '2026-10-13', count: 1 })
  })

  it('starts weeks on Monday and drops the days before the first Monday', () => {
    // 2026-10-11 is a Sunday.
    const calendar = computeContributionCalendar([
      account(daysFrom('2026-10-11', [9, 1, 1, 1, 1, 1, 1, 1])),
    ])

    expect(calendar?.weeks).toHaveLength(1)
    expect(calendar?.weeks[0]?.map((day) => day?.date)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ])
    expect(calendar?.total).toBe(7)
  })

  it('leaves missing and future days as empty slots', () => {
    const calendar = computeContributionCalendar([
      account({ '2026-10-12': 1, '2026-10-14': 1, '2026-10-16': 1 }),
    ])

    expect(calendar?.weeks[0]?.map((day) => day?.date ?? null)).toEqual([
      '2026-10-12',
      null,
      '2026-10-14',
      null,
      '2026-10-16',
      null,
      null,
    ])
  })

  it('shades active days by the quartiles of the active days', () => {
    const calendar = computeContributionCalendar([
      account(daysFrom('2026-10-12', [0, 1, 2, 3, 4, 5, 6, 7, 8])),
    ])

    const levels = calendar?.weeks.flat().flatMap((day) => (day == null ? [] : [day.level]))
    expect(levels).toEqual([0, 1, 1, 1, 2, 2, 3, 3, 4])
  })

  it('counts active days', () => {
    const calendar = computeContributionCalendar([account(daysFrom('2026-10-12', [0, 3, 0, 1]))])

    expect(calendar?.activeDays).toBe(2)
  })

  it('records how many accounts were combined', () => {
    const calendar = computeContributionCalendar([
      account({ '2026-10-12': 1 }),
      account({ '2026-10-12': 1 }),
    ])

    expect(calendar?.accountCount).toBe(2)
  })

  it('labels the weeks where a month starts', () => {
    // Monday 2026-09-28; 1 Oct falls in week 0 and 1 Nov (a Sunday) in week 4.
    const calendar = computeContributionCalendar([
      account(daysFrom('2026-09-28', Array<number>(49).fill(1))),
    ])

    expect(calendar?.months).toEqual([
      { week: 0, label: 'Oct' },
      { week: 4, label: 'Nov' },
    ])
  })

  it('labels a leading partial month when the next month starts three or more weeks later', () => {
    // Monday 2026-10-05; 1 Nov falls in week 3.
    const calendar = computeContributionCalendar([
      account(daysFrom('2026-10-05', Array<number>(35).fill(1))),
    ])

    expect(calendar?.months).toEqual([
      { week: 0, label: 'Oct' },
      { week: 3, label: 'Nov' },
    ])
  })

  it('skips a leading partial month too narrow for its label', () => {
    // Monday 2026-10-12; 1 Nov falls in week 2.
    const calendar = computeContributionCalendar([
      account(daysFrom('2026-10-12', Array<number>(28).fill(1))),
    ])

    expect(calendar?.months).toEqual([{ week: 2, label: 'Nov' }])
  })

  it('skips a month label in the last week, where it would overflow the grid', () => {
    // Monday 2026-10-19; 1 Nov falls in week 1, the last one.
    const calendar = computeContributionCalendar([
      account(daysFrom('2026-10-19', Array<number>(14).fill(1))),
    ])

    expect(calendar?.months).toEqual([])
  })

  it('returns null when there is no Monday to start from', () => {
    expect(computeContributionCalendar([account({})])).toBeNull()
    expect(computeContributionCalendar([account({ '2026-10-11': 4 })])).toBeNull()
  })
})

describe('parseContributionAccounts', () => {
  it('returns no accounts when the variable is unset or blank', () => {
    expect(parseContributionAccounts(undefined)).toEqual({ success: true, data: [] })
    expect(parseContributionAccounts(' ')).toEqual({ success: true, data: [] })
  })

  it('splits a comma-separated list of logins', () => {
    expect(parseContributionAccounts('octocat, hubot ,')).toEqual({
      success: true,
      data: ['octocat', 'hubot'],
    })
  })

  it('drops repeated logins, ignoring case, so no account counts twice', () => {
    expect(parseContributionAccounts('octocat,OctoCat, hubot')).toEqual({
      success: true,
      data: ['octocat', 'hubot'],
    })
  })

  it('rejects a value that is not a GitHub login', () => {
    expect(parseContributionAccounts('octocat,not a login').success).toBe(false)
  })
})

const DAY_MS = 86_400_000
const dayNumber = (date: string): number => Date.parse(`${date}T00:00:00Z`) / DAY_MS
const dayAfter = (date: string): string =>
  new Date((dayNumber(date) + 1) * DAY_MS).toISOString().slice(0, 10)
const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

describe('windowBounds', () => {
  it('ends window 0 on the anchor date', () => {
    expect(windowBounds('2026-10-16', 0)).toEqual({
      start: '2025-10-17',
      end: '2026-10-16',
      from: '2025-10-17T00:00:00Z',
      to: '2026-10-16T23:59:59Z',
    })
  })

  it('ends window 1 one year earlier', () => {
    expect(windowBounds('2026-10-16', 1)).toMatchObject({ start: '2024-10-17', end: '2025-10-16' })
  })

  it.each(['2026-10-16', '2028-02-29', '2027-02-28', '2028-02-28', '2028-03-01'])(
    'gives every window for anchor %s the right end and a length of 365 or 366 days',
    (anchor) => {
      const anchorYear = Number(anchor.slice(0, 4))
      const monthDay = anchor.slice(5)
      for (let years = 0; years <= 15; years++) {
        const bounds = windowBounds(anchor, years)
        const year = anchorYear - years
        const expectedMonthDay = monthDay === '02-29' && !isLeapYear(year) ? '02-28' : monthDay
        expect(bounds.end).toBe(`${year.toString()}-${expectedMonthDay}`)
        expect([365, 366]).toContain(dayNumber(bounds.end) - dayNumber(bounds.start) + 1)
        expect(dayAfter(windowBounds(anchor, years + 1).end)).toBe(bounds.start)
      }
    }
  )

  it('uses 28 Feb for a 29 Feb anchor in non-leap years', () => {
    expect(windowBounds('2028-02-29', 1).end).toBe('2027-02-28')
    expect(windowBounds('2028-02-29', 0).start).toBe('2027-03-01')
    expect(windowBounds('2028-02-29', 4).end).toBe('2024-02-29')
  })
})

describe('windowOverlapsYears / oldestWindowIndex', () => {
  it('matches a window against active years', () => {
    const bounds = windowBounds('2026-10-16', 15) // 2010-10-17 – 2011-10-16
    expect(windowOverlapsYears(bounds, [2011])).toBe(true)
    expect(windowOverlapsYears(bounds, [2010])).toBe(true)
    expect(windowOverlapsYears(bounds, [2012, 2009])).toBe(false)
  })

  it('finds the last window that overlaps the earliest active year', () => {
    expect(oldestWindowIndex('2026-10-16', [2026, 2011])).toBe(15)
    expect(oldestWindowIndex('2026-10-16', [2026, 2025, 2024, 2023])).toBe(3)
    expect(oldestWindowIndex('2026-10-16', [])).toBe(0)
  })
})

describe('buildHeatmapWindow', () => {
  const bounds = windowBounds('2026-10-16', 0) // 2025-10-17 – 2026-10-16

  it('sums the accounts per day, in date order, with zeros for missing days', () => {
    const period = buildHeatmapWindow(bounds, [
      account({ '2025-10-17': 2, '2025-10-19': 1 }),
      account({ '2025-10-17': 3 }),
    ])

    expect(period.start).toBe('2025-10-17')
    expect(period.counts).toHaveLength(365)
    expect(period.counts.slice(0, 3)).toEqual([5, 0, 1])
    expect(period.total).toBe(6)
    expect(period.activeDays).toBe(2)
    expect(period.accountCount).toBe(2)
  })

  it('ignores days outside the window', () => {
    const period = buildHeatmapWindow(bounds, [
      account({ '2025-10-16': 7, '2026-10-16': 1, '2026-10-17': 9 }),
    ])

    expect(period.counts.at(-1)).toBe(1)
    expect(period.total).toBe(1)
  })

  it('treats an unfetched account as zeros', () => {
    const period = buildHeatmapWindow(bounds, [account({ '2025-10-17': 2 }), null])

    expect(period.total).toBe(2)
    expect(period.accountCount).toBe(1)
  })

  it('counts only accounts with contributions', () => {
    const period = buildHeatmapWindow(bounds, [
      account({ '2025-10-17': 2 }),
      account({ '2025-10-17': 0 }),
    ])

    expect(period.accountCount).toBe(1)
  })

  it('sets thresholds from the quartiles of the active days', () => {
    const period = buildHeatmapWindow(bounds, [
      account(daysFrom('2025-10-17', [1, 2, 3, 4, 5, 6, 7, 8])),
    ])

    expect(period.thresholds).toEqual([3, 5, 7])
    expect(period.total).toBe(36)
    expect(period.activeDays).toBe(8)
  })

  it('describes an empty window', () => {
    expect(buildHeatmapWindow(bounds, [account({})])).toMatchObject({
      thresholds: [],
      total: 0,
      activeDays: 0,
      accountCount: 0,
    })
  })
})
