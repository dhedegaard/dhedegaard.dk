import { captureException } from '@sentry/nextjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getGithubContributions, type GithubContributions } from '../../clients/github'
import { windowBounds } from '../contribution-calendar'
import { getHeatmapWindows } from '../data-action'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('../../clients/github', () => ({ getGithubUser: vi.fn(), getGithubContributions: vi.fn() }))

const now = new Date('2026-10-16T12:00:00Z')
const ANCHOR = '2026-10-16'

// One day of contributions at the start of the window, with the account's active years.
const calendar = (
  start: string,
  contributionCount: number,
  contributionYears: number[]
): GithubContributions => ({
  contributionsCollection: {
    contributionYears,
    contributionCalendar: {
      weeks: [{ contributionDays: [{ date: start, contributionCount }] }],
    },
  },
})

const windowIndex = (from: string): number => {
  for (let years = 0; years < 30; years++) {
    if (windowBounds(ANCHOR, years).from === from) {
      return years
    }
  }
  throw new Error(`Unexpected window ${from}`)
}

interface MockAccount {
  years: number[]
  // The window's count, or a promise to return instead of a calendar.
  count?: (years: number) => number | Promise<never>
}
const respond = (accounts: Record<string, MockAccount>) => {
  vi.mocked(getGithubContributions).mockImplementation((login, range) => {
    const account = accounts[login]
    if (account == null) {
      return Promise.reject(new Error(`Unknown login ${login}`))
    }
    const years = windowIndex(range.from)
    const count = account.count?.(years) ?? 1
    return typeof count === 'number'
      ? Promise.resolve(calendar(windowBounds(ANCHOR, years).start, count, account.years))
      : count
  })
}

const calledWindows = (login: string): number[] =>
  vi
    .mocked(getGithubContributions)
    .mock.calls.filter(([called]) => called === login)
    .map(([, range]) => windowIndex(range.from))

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
  vi.mocked(console.error).mockRestore()
})

describe('getHeatmapWindows', () => {
  it('fetches the latest window for every account first', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat,hubot')
    respond({ octocat: { years: [2026, 2025] }, hubot: { years: [2026] } })

    const windows = await getHeatmapWindows(now)

    const latest = windowBounds(ANCHOR, 0)
    expect(vi.mocked(getGithubContributions).mock.calls.slice(0, 2)).toEqual([
      ['octocat', expect.objectContaining({ from: latest.from, to: latest.to })],
      ['hubot', expect.objectContaining({ from: latest.from, to: latest.to })],
    ])
    expect(windows?.[0]).toMatchObject({ start: latest.start, total: 2, accountCount: 2 })
  })

  it('fetches older windows only where an account was active', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat,hubot')
    respond({ octocat: { years: [2026, 2025, 2024] }, hubot: { years: [2026] } })

    const windows = await getHeatmapWindows(now)

    expect(calledWindows('octocat')).toEqual([0, 1, 2])
    expect(calledWindows('hubot')).toEqual([0])
    expect(windows?.map((period) => period.start)).toEqual(
      [0, 1, 2].map((years) => windowBounds(ANCHOR, years).start)
    )
    expect(windows?.[1]?.accountCount).toBe(1)
  })

  it('keeps a middle window without activity as zeros', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat')
    respond({ octocat: { years: [2026, 2023] } })

    const windows = await getHeatmapWindows(now)

    expect(calledWindows('octocat')).toEqual([0, 2, 3])
    expect(windows).toHaveLength(4)
    expect(windows?.[1]).toMatchObject({ total: 0, accountCount: 0 })
  })

  it('drops trailing windows without contributions', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat')
    respond({ octocat: { years: [2026, 2025, 2024], count: (years) => (years === 2 ? 0 : 1) } })

    expect(await getHeatmapWindows(now)).toHaveLength(2)
  })

  it('keeps the latest window even without contributions', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat')
    respond({ octocat: { years: [2026], count: () => 0 } })

    expect(await getHeatmapWindows(now)).toEqual([expect.objectContaining({ total: 0 })])
  })

  it('returns null and reports when the latest window fails', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat,hubot')
    respond({
      octocat: { years: [2026] },
      hubot: { years: [2026], count: () => Promise.reject(new Error('not found')) },
    })

    expect(await getHeatmapWindows(now)).toBeNull()
    expect(captureException).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledOnce()
  })

  it('cuts the history before the first failed older window', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat')
    respond({
      octocat: {
        years: [2026, 2025, 2024, 2023],
        count: (years) => (years === 2 ? Promise.reject(new Error('502')) : 1),
      },
    })

    const windows = await getHeatmapWindows(now)

    expect(windows).toHaveLength(2)
    expect(captureException).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledOnce()
  })

  it('cuts the history at the older-phase deadline', async () => {
    vi.useFakeTimers({ now })
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat')
    respond({
      octocat: {
        years: [2026, 2025, 2024],
        count: (years) => (years === 2 ? new Promise<never>(() => undefined) : 1),
      },
    })

    const result = getHeatmapWindows(now)
    await vi.advanceTimersByTimeAsync(25_000)

    expect(await result).toHaveLength(2)
    expect(captureException).toHaveBeenCalledOnce()
  })

  it('returns null and reports when the windows fail validation', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat')
    respond({ octocat: { years: [2026], count: () => 1.5 } })

    expect(await getHeatmapWindows(now)).toBeNull()
    expect(captureException).toHaveBeenCalledOnce()
  })

  it('returns null and fetches nothing when no accounts are configured', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', '')

    expect(await getHeatmapWindows(now)).toBeNull()
    expect(getGithubContributions).not.toHaveBeenCalled()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('reports a malformed account list instead of fetching', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'not a login')

    expect(await getHeatmapWindows(now)).toBeNull()
    expect(getGithubContributions).not.toHaveBeenCalled()
    expect(captureException).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledOnce()
  })
})
