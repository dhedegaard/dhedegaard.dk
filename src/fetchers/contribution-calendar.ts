import * as z from 'zod/mini'
import type { GithubContributions } from '../clients/github'

const DAY_MS = 86_400_000

const GithubLogin = z
  .string()
  .check(z.regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, 'Not a GitHub login'))

const GithubLogins = z.array(GithubLogin)

/** Parse the comma-separated `GITHUB_CONTRIBUTION_ACCOUNTS` value; unset means no accounts. */
export const parseContributionAccounts = (value: string | undefined) => {
  const logins = (value ?? '')
    .split(',')
    .map((login) => login.trim())
    .filter((login) => login !== '')
  // Logins are case-insensitive; keep the first spelling of each.
  return GithubLogins.safeParse(
    logins.filter(
      (login, index) =>
        logins.findIndex((other) => other.toLowerCase() === login.toLowerCase()) === index
    )
  )
}

const dayNumber = (date: string): number => Date.parse(`${date}T00:00:00Z`) / DAY_MS

// GitHub-style shading: quartiles of the active days' counts.
const quartiles = (counts: readonly number[]): number[] => {
  const active = counts.filter((count) => count > 0).sort((left, right) => left - right)
  return [0.25, 0.5, 0.75].flatMap((fraction) => {
    const threshold = active[Math.floor(active.length * fraction)]
    return threshold == null ? [] : [threshold]
  })
}

/** One 12-month window of daily totals, compact enough to send to the browser. */
export const HeatmapWindow = z.object({
  start: z.iso.date(),
  // One count per day from `start`.
  counts: z.array(z.int().check(z.nonnegative())),
  thresholds: z.array(z.int().check(z.positive())).check(z.maxLength(3)),
  total: z.int().check(z.nonnegative()),
  activeDays: z.int().check(z.nonnegative()),
})
export interface HeatmapWindow extends z.infer<typeof HeatmapWindow> {}

interface WindowBounds {
  start: string
  end: string
  from: string
  to: string
}

const isoDay = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10)
const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

// Keeps the month and day; setUTCFullYear would roll 29 Feb over to 1 Mar.
const yearsBefore = (date: string, years: number): string => {
  const year = Number(date.slice(0, 4)) - years
  const monthDay = date.slice(5) === '02-29' && !isLeapYear(year) ? '02-28' : date.slice(5)
  return `${year.toString().padStart(4, '0')}-${monthDay}`
}

/** Window `years` ends that many years before the anchor and starts the day after the next one ends. */
export const windowBounds = (anchor: string, years: number): WindowBounds => {
  const end = yearsBefore(anchor, years)
  const start = isoDay(dayNumber(yearsBefore(anchor, years + 1)) + 1)
  return { start, end, from: `${start}T00:00:00Z`, to: `${end}T23:59:59Z` }
}

export const windowOverlapsYears = (
  bounds: WindowBounds,
  activeYears: readonly number[]
): boolean =>
  activeYears.some(
    (year) => bounds.start <= `${year.toString()}-12-31` && bounds.end >= `${year.toString()}-01-01`
  )

/** The last window that overlaps the earliest active year; 0 without any. */
export const oldestWindowIndex = (anchor: string, activeYears: readonly number[]): number => {
  if (activeYears.length === 0) {
    return 0
  }
  const earliestDay = `${Math.min(...activeYears).toString()}-01-01`
  let years = 0
  while (windowBounds(anchor, years + 1).end >= earliestDay) {
    years++
  }
  return years
}

/** Sum the accounts' days inside the window; a null account wasn't fetched and counts as zeros. */
export const buildHeatmapWindow = (
  bounds: WindowBounds,
  accounts: readonly (GithubContributions | null)[]
): HeatmapWindow => {
  const first = dayNumber(bounds.start)
  const counts = Array.from({ length: dayNumber(bounds.end) - first + 1 }, () => 0)
  for (const account of accounts) {
    for (const week of account?.contributionsCollection.contributionCalendar.weeks ?? []) {
      for (const day of week.contributionDays) {
        const index = dayNumber(day.date) - first
        if (index >= 0 && index < counts.length) {
          counts[index] = (counts[index] ?? 0) + day.contributionCount
        }
      }
    }
  }
  return {
    start: bounds.start,
    counts,
    thresholds: quartiles(counts),
    total: counts.reduce((sum, count) => sum + count, 0),
    activeDays: counts.filter((count) => count > 0).length,
  }
}
