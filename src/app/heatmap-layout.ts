import type { HeatmapWindow } from '../fetchers/contribution-calendar'

// Browser-safe layout maths for the heatmap: no zod, no server imports.

export interface HeatmapDay {
  date: string
  count: number
  level: number
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAY_MS = 86_400_000
// A month label needs about three week columns of room.
const MONTH_LABEL_WEEKS = 3

const numberFormat = new Intl.NumberFormat('en-US')

const dayNumber = (date: string): number => Date.parse(`${date}T00:00:00Z`) / DAY_MS
const isoDay = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10)
const mondayIndex = (date: string): number => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7
const monthLabel = (date: string): string => MONTH_LABELS[Number(date.slice(5, 7)) - 1] ?? ''

// GitHub-style shading: quartiles of the active days' counts.
export const levelOf = (thresholds: readonly number[], count: number): number =>
  count === 0 ? 0 : 1 + thresholds.filter((threshold) => count > threshold).length

/** Monday-first weeks of 7 slots; null pads the slots before the first and after the last day. */
export const heatmapWeeks = (period: HeatmapWindow): (HeatmapDay | null)[][] => {
  const first = dayNumber(period.start)
  const pad = mondayIndex(period.start)
  const weekCount = Math.ceil((pad + period.counts.length) / 7)
  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday): HeatmapDay | null => {
      const index = week * 7 + weekday - pad
      const count = period.counts[index]
      return index < 0 || count == null
        ? null
        : { date: isoDay(first + index), count, level: levelOf(period.thresholds, count) }
    })
  )
}

export const monthLabels = (
  weeks: readonly (readonly (HeatmapDay | null)[])[]
): { week: number; label: string }[] => {
  const starts = weeks.flatMap((week, index) => {
    const first = week.find((day) => day?.date.endsWith('-01'))
    return first == null ? [] : [{ week: index, label: monthLabel(first.date) }]
  })
  const firstDay = weeks[0]?.find((day) => day != null)
  const leading =
    firstDay != null && (starts[0]?.week ?? Infinity) >= MONTH_LABEL_WEEKS
      ? [{ week: 0, label: monthLabel(firstDay.date) }]
      : []
  // A label in the last week would overflow the grid.
  return [...leading, ...starts].filter(({ week }) => week <= weeks.length - 2)
}

const windowEnd = (period: HeatmapWindow): string =>
  isoDay(dayNumber(period.start) + period.counts.length - 1)

const shortDate = (date: string): string => {
  const day = new Date(`${date}T00:00:00Z`)
  const month = MONTH_LABELS[day.getUTCMonth()] ?? ''
  return `${day.getUTCDate().toString()} ${month} ${day.getUTCFullYear().toString()}`
}

export const formatDay = (date: string): string =>
  `${WEEKDAY_LABELS[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? ''}, ${shortDate(date)}`

export const pluralize = (count: number, noun: string): string =>
  `${numberFormat.format(count)} ${count === 1 ? noun : `${noun}s`}`

export const periodLabel = (period: HeatmapWindow, latest: boolean): string =>
  latest ? 'Past 12 months' : `${shortDate(period.start)} – ${shortDate(windowEnd(period))}`

const periodPhrase = (period: HeatmapWindow, latest: boolean): string =>
  latest
    ? 'over the past year'
    : `from ${shortDate(period.start)} to ${shortDate(windowEnd(period))}`

export const heatmapCaption = (period: HeatmapWindow, latest: boolean): string =>
  `Contributions ${periodPhrase(period, latest)}${
    period.accountCount >= 2
      ? ' across my personal and work GitHub accounts, private repos included.'
      : ' on GitHub, private repos included.'
  }`

export const heatmapSummary = (period: HeatmapWindow, latest: boolean): string =>
  `${pluralize(period.total, 'contribution')} ${periodPhrase(period, latest)}, on ${pluralize(period.activeDays, 'day')}`
