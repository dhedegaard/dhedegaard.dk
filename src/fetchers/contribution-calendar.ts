import * as z from 'zod/mini'
import type { GithubContributions } from '../clients/github'

export const MONTH_LABELS = [
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

const DAY_MS = 86_400_000
// A month label needs about three week columns of room.
const MONTH_LABEL_WEEKS = 3

const ContributionDay = z.object({
  date: z.iso.date(),
  count: z.int().check(z.nonnegative()),
  level: z.int().check(z.gte(0), z.lte(4)),
})
export interface ContributionDay extends z.infer<typeof ContributionDay> {}

const MonthLabel = z.object({
  week: z.int().check(z.nonnegative()),
  label: z.string().check(z.minLength(1)),
})
interface MonthLabel extends z.infer<typeof MonthLabel> {}

export const ContributionCalendar = z.object({
  accountCount: z.int().check(z.positive()),
  total: z.int().check(z.nonnegative()),
  activeDays: z.int().check(z.nonnegative()),
  // Monday-first weeks; null marks a day outside the calendar.
  weeks: z.array(
    z
      .array(z.nullable(ContributionDay as z.ZodMiniType<ContributionDay, ContributionDay>))
      .check(z.length(7))
  ),
  months: z.array(MonthLabel as z.ZodMiniType<MonthLabel, MonthLabel>),
})
export interface ContributionCalendar extends z.infer<typeof ContributionCalendar> {}

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
const mondayIndex = (date: string): number => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7
const monthLabel = (date: string): string => MONTH_LABELS[Number(date.slice(5, 7)) - 1] ?? ''

// GitHub-style shading: quartiles of the active days' counts.
const levelOf = (thresholds: readonly number[]) => (count: number) =>
  count === 0 ? 0 : 1 + thresholds.filter((threshold) => count > threshold).length

const quartiles = (counts: readonly number[]): number[] => {
  const active = counts.filter((count) => count > 0).sort((left, right) => left - right)
  return [0.25, 0.5, 0.75].flatMap((fraction) => {
    const threshold = active[Math.floor(active.length * fraction)]
    return threshold == null ? [] : [threshold]
  })
}

const monthLabels = (weeks: readonly (readonly (ContributionDay | null)[])[]): MonthLabel[] => {
  const starts = weeks.flatMap((week, index) => {
    const first = week.find((day) => day?.date.endsWith('-01'))
    return first == null ? [] : [{ week: index, label: monthLabel(first.date) }]
  })
  const firstDay = weeks[0]?.[0]
  const leading =
    firstDay != null && (starts[0]?.week ?? Infinity) >= MONTH_LABEL_WEEKS
      ? [{ week: 0, label: monthLabel(firstDay.date) }]
      : []
  // A label in the last week would overflow the grid.
  return [...leading, ...starts].filter(({ week }) => week <= weeks.length - 2)
}

/** Sum the accounts' calendars by date into Monday-first weeks; null when there's nothing to show. */
export const computeContributionCalendar = (
  accounts: readonly GithubContributions[]
): ContributionCalendar | null => {
  const counts = new Map<string, number>()
  for (const account of accounts) {
    for (const week of account.contributionsCollection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        counts.set(day.date, (counts.get(day.date) ?? 0) + day.contributionCount)
      }
    }
  }

  // GitHub's calendar starts on the Sunday before a year ago; that day falls outside the year.
  const dates = [...counts.keys()].sort()
  const firstMonday = dates.find((date) => mondayIndex(date) === 0)
  if (firstMonday == null) {
    return null
  }
  const included = [...counts].filter(([date]) => date >= firstMonday).map(([, count]) => count)
  const level = levelOf(quartiles(included))
  const start = dayNumber(firstMonday)
  const weekCount = Math.floor((dayNumber(dates.at(-1) ?? firstMonday) - start) / 7) + 1
  const weeks = Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday): ContributionDay | null => {
      const date = new Date((start + week * 7 + weekday) * DAY_MS).toISOString().slice(0, 10)
      const count = counts.get(date)
      return count == null ? null : { date, count, level: level(count) }
    })
  )

  return {
    accountCount: accounts.length,
    total: included.reduce((sum, count) => sum + count, 0),
    activeDays: included.filter((count) => count > 0).length,
    weeks,
    months: monthLabels(weeks),
  } satisfies ContributionCalendar
}
