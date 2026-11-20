import { captureException } from '@sentry/nextjs'
import * as z from 'zod/mini'
import { getGithubContributions, type GithubContributions } from '../clients/github'
import {
  HeatmapWindow,
  buildHeatmapWindow,
  oldestWindowIndex,
  contributionAccountsFromEnv,
  type WindowBounds,
  windowBounds,
  windowOverlapsYears,
} from './contribution-calendar'
import { runWithConcurrency } from './run-with-concurrency'

const reportContributionError = (message: string, cause: unknown): null => {
  const error = new Error(message, { cause })
  console.error(error)
  captureException(error)
  return null
}

const MAX_CONCURRENT_REQUESTS = 6
// Older windows must finish within Next's 50 s prerender limit, after the user query and window 0.
const OLDER_WINDOWS_BUDGET_MS = 25_000

interface OlderWindow {
  bounds: WindowBounds
  accounts: (GithubContributions | null)[]
}

interface WindowRequest {
  index: number
  account: number
  run: (signal: AbortSignal) => Promise<GithubContributions>
}

const HeatmapWindows = z.array(HeatmapWindow).check(z.minLength(1))

/**
 * The Activity heatmap's 12-month windows, newest first, fetched apart from `getGithubData()`:
 * any failure hides only the heatmap, and a failed older window only cuts the history short.
 */
export async function getHeatmapWindows(now: Date): Promise<HeatmapWindow[] | null> {
  const started = Date.now()
  const accounts = contributionAccountsFromEnv()
  if (!accounts.success) {
    return reportContributionError('Invalid GITHUB_CONTRIBUTION_ACCOUNTS', accounts.error)
  }
  const logins = accounts.data
  if (logins.length === 0) {
    return null
  }
  const anchor = now.toISOString().slice(0, 10)

  const latestBounds = windowBounds(anchor, 0)
  const latest: GithubContributions[] = []
  for (const result of await runWithConcurrency(
    logins.map((login) => () => getGithubContributions(login, latestBounds)),
    MAX_CONCURRENT_REQUESTS
  )) {
    if (result.status === 'rejected') {
      return reportContributionError('Error fetching contribution calendars', result.reason)
    }
    latest.push(result.value)
  }

  // Older windows are fetched only for the accounts active in them; the rest count as zeros.
  const activeYears = latest.map((account) => account.contributionsCollection.contributionYears)
  const oldest = Math.max(0, ...activeYears.map((years) => oldestWindowIndex(anchor, years)))
  const older = Array.from({ length: oldest }, (_, index) => {
    const bounds = windowBounds(anchor, index + 1)
    return {
      bounds,
      accounts: logins.map((): GithubContributions | null => null),
    } satisfies OlderWindow
  })
  const requests = older.flatMap((period, index) =>
    logins.flatMap((login, account) =>
      windowOverlapsYears(period.bounds, activeYears[account] ?? [])
        ? [
            {
              index,
              account,
              run: (signal: AbortSignal) => getGithubContributions(login, period.bounds, signal),
            } satisfies WindowRequest,
          ]
        : []
    )
  )
  const settled = await runWithConcurrency(
    requests.map(({ run }) => run),
    MAX_CONCURRENT_REQUESTS,
    started + OLDER_WINDOWS_BUDGET_MS
  )
  let cut = older.length
  let failure: unknown
  requests.forEach(({ index, account }, request) => {
    const result = settled[request]
    const period = older[index]
    if (result?.status === 'fulfilled' && period != null) {
      period.accounts[account] = result.value
    } else if (index < cut) {
      cut = index
      failure = result?.status === 'rejected' ? result.reason : undefined
    }
  })
  if (cut < older.length) {
    reportContributionError('Error fetching older contribution windows', failure)
  }

  const windows = [
    buildHeatmapWindow(latestBounds, latest),
    ...older.slice(0, cut).map((period) => buildHeatmapWindow(period.bounds, period.accounts)),
  ]
  while (windows.length > 1 && windows.at(-1)?.total === 0) {
    windows.pop()
  }
  const parsed = HeatmapWindows.safeParse(windows)
  return parsed.success
    ? parsed.data
    : reportContributionError('Invalid contribution windows', parsed.error)
}
