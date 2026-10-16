import { describe, expect, it } from 'vitest'
import type { GithubContributions } from '../../clients/github'
import { computeContributionCalendar, parseContributionAccounts } from '../contribution-calendar'

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
      account(
        daysFrom(
          '2026-09-28',
          Array.from({ length: 49 }, () => 1)
        )
      ),
    ])

    expect(calendar?.months).toEqual([
      { week: 0, label: 'Oct' },
      { week: 4, label: 'Nov' },
    ])
  })

  it('labels a leading partial month when the next month starts three or more weeks later', () => {
    // Monday 2026-10-05; 1 Nov falls in week 3.
    const calendar = computeContributionCalendar([
      account(
        daysFrom(
          '2026-10-05',
          Array.from({ length: 35 }, () => 1)
        )
      ),
    ])

    expect(calendar?.months).toEqual([
      { week: 0, label: 'Oct' },
      { week: 3, label: 'Nov' },
    ])
  })

  it('skips a leading partial month too narrow for its label', () => {
    // Monday 2026-10-12; 1 Nov falls in week 2.
    const calendar = computeContributionCalendar([
      account(
        daysFrom(
          '2026-10-12',
          Array.from({ length: 28 }, () => 1)
        )
      ),
    ])

    expect(calendar?.months).toEqual([{ week: 2, label: 'Nov' }])
  })

  it('skips a month label in the last week, where it would overflow the grid', () => {
    // Monday 2026-10-19; 1 Nov falls in week 1, the last one.
    const calendar = computeContributionCalendar([
      account(
        daysFrom(
          '2026-10-19',
          Array.from({ length: 14 }, () => 1)
        )
      ),
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
