import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HeatmapWindow } from '../../fetchers/contribution-calendar'
import {
  formatDay,
  heatmapCaption,
  heatmapSummary,
  heatmapWeeks,
  levelOf,
  monthLabels,
  periodLabel,
} from '../heatmap-layout'

afterEach(() => {
  vi.unstubAllEnvs()
})

const period = (start: string, counts: readonly number[], extra?: Partial<HeatmapWindow>) =>
  ({
    start,
    counts: [...counts],
    thresholds: [],
    accountCount: 1,
    total: counts.reduce((sum, count) => sum + count, 0),
    activeDays: counts.filter((count) => count > 0).length,
    ...extra,
  }) satisfies HeatmapWindow

const zeros = (length: number): number[] => Array.from({ length }, () => 0)

describe('heatmapWeeks', () => {
  it.each([
    ['2024-10-14', 0],
    ['2024-10-15', 1],
    ['2024-10-16', 2],
    ['2024-10-17', 3],
    ['2024-10-18', 4],
    ['2024-10-19', 5],
    ['2024-10-20', 6],
  ])('pads a window starting %s with %i leading empty slots', (start, pad) => {
    const [first] = heatmapWeeks(period(start, zeros(14)))

    expect(first?.findIndex((day) => day != null)).toBe(pad)
    expect(first?.[pad]?.date).toBe(start)
  })

  it('leaves trailing slots empty after the last day', () => {
    // Monday plus two days: the rest of the week is empty.
    const weeks = heatmapWeeks(period('2024-10-14', [1, 2, 3]))

    expect(weeks).toHaveLength(1)
    expect(weeks[0]?.map((day) => day?.count ?? null)).toEqual([1, 2, 3, null, null, null, null])
  })

  it('lays out consecutive dates Monday first', () => {
    const weeks = heatmapWeeks(period('2024-10-17', zeros(10)))

    expect(weeks).toHaveLength(2)
    expect(weeks[1]?.[0]?.date).toBe('2024-10-21')
    expect(weeks[1]?.[5]?.date).toBe('2024-10-26')
    expect(weeks[1]?.[6]).toBeNull()
  })

  it('shades each day through the thresholds', () => {
    const weeks = heatmapWeeks(period('2024-10-14', [0, 1, 6, 8], { thresholds: [3, 5, 7] }))

    expect(weeks[0]?.slice(0, 4).map((day) => day?.level)).toEqual([0, 1, 3, 4])
  })
})

describe('levelOf', () => {
  it('maps counts to levels through the thresholds', () => {
    expect([0, 1, 3, 4, 5, 6, 8].map((count) => levelOf([3, 5, 7], count))).toEqual([
      0, 1, 1, 2, 2, 3, 4,
    ])
    expect(levelOf([], 2)).toBe(1)
  })
})

describe('monthLabels', () => {
  it('labels a month above the week it starts in', () => {
    // 1 Nov 2024 is in week 2 when the window starts on Thursday 17 Oct.
    expect(monthLabels(heatmapWeeks(period('2024-10-17', zeros(30))))).toEqual([
      { week: 2, label: 'Nov' },
    ])
  })

  it('labels a leading partial month from the first real day of a padded week 0', () => {
    // 1 Nov 2024 is in week 4 when the window starts on Thursday 3 Oct.
    expect(monthLabels(heatmapWeeks(period('2024-10-03', zeros(50))))).toEqual([
      { week: 0, label: 'Oct' },
      { week: 4, label: 'Nov' },
    ])
  })

  it('skips a month label in the last week', () => {
    // 1 Nov 2024 is a Friday in the last of three weeks.
    expect(monthLabels(heatmapWeeks(period('2024-10-14', zeros(20))))).toEqual([])
  })
})

describe('formatting', () => {
  it.each(['America/Los_Angeles', 'Pacific/Kiritimati'])(
    'formats days in UTC under TZ=%s',
    (tz) => {
      vi.stubEnv('TZ', tz)

      expect(formatDay('2026-10-12')).toBe('Mon, 12 Oct 2026')
      expect(formatDay('2025-12-31')).toBe('Wed, 31 Dec 2025')
      expect(heatmapWeeks(period('2024-10-17', zeros(7)))[0]?.findIndex((day) => day != null)).toBe(
        3
      )
      expect(periodLabel(period('2024-10-17', zeros(365)), false)).toBe('17 Oct 2024 – 16 Oct 2025')
    }
  )

  it('labels periods', () => {
    expect(periodLabel(period('2025-10-17', zeros(365)), true)).toBe('Past 12 months')
    expect(periodLabel(period('2024-10-17', zeros(365)), false)).toBe('17 Oct 2024 – 16 Oct 2025')
  })

  it('builds captions for each window and account count', () => {
    const latest = period('2025-10-17', zeros(365), { accountCount: 2 })
    const older = period('2024-10-17', zeros(365), { accountCount: 2 })

    expect(heatmapCaption(latest, true)).toBe(
      'Contributions over the past year across my personal and work GitHub accounts, private repos included.'
    )
    expect(heatmapCaption({ ...latest, accountCount: 1 }, true)).toBe(
      'Contributions over the past year on GitHub, private repos included.'
    )
    expect(heatmapCaption(older, false)).toBe(
      'Contributions from 17 Oct 2024 to 16 Oct 2025 across my personal and work GitHub accounts, private repos included.'
    )
    expect(heatmapCaption({ ...older, accountCount: 1 }, false)).toBe(
      'Contributions from 17 Oct 2024 to 16 Oct 2025 on GitHub, private repos included.'
    )
    expect(heatmapCaption({ ...older, accountCount: 0 }, false)).toBe(
      'Contributions from 17 Oct 2024 to 16 Oct 2025 on GitHub, private repos included.'
    )
  })

  it('summarises windows for screen readers, including singular and empty', () => {
    const base = period('2024-10-17', zeros(365))

    expect(heatmapSummary({ ...base, total: 10_494, activeDays: 288 }, true)).toBe(
      '10,494 contributions over the past year, on 288 days'
    )
    expect(heatmapSummary({ ...base, total: 1, activeDays: 1 }, false)).toBe(
      '1 contribution from 17 Oct 2024 to 16 Oct 2025, on 1 day'
    )
    expect(heatmapSummary(base, false)).toBe(
      '0 contributions from 17 Oct 2024 to 16 Oct 2025, on 0 days'
    )
  })
})
