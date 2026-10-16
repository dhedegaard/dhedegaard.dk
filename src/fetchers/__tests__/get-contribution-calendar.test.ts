import { captureException } from '@sentry/nextjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getGithubContributions, type GithubContributions } from '../../clients/github'
import { getContributionCalendar } from '../data-action'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('../../clients/github', () => ({ getGithubUser: vi.fn(), getGithubContributions: vi.fn() }))

// A one-day calendar on a Monday.
const calendar = (contributionCount: number): GithubContributions => ({
  contributionsCollection: {
    contributionCalendar: {
      weeks: [{ contributionDays: [{ date: '2026-10-12', contributionCount }] }],
    },
  },
})

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(console.error).mockRestore()
})

describe('getContributionCalendar', () => {
  it('combines the configured accounts into one calendar', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat,hubot')
    vi.mocked(getGithubContributions).mockImplementation((login) =>
      Promise.resolve(calendar(login === 'octocat' ? 2 : 3))
    )

    const result = await getContributionCalendar()

    expect(vi.mocked(getGithubContributions).mock.calls.map(([login]) => login)).toEqual([
      'octocat',
      'hubot',
    ])
    expect(result?.total).toBe(5)
  })

  it('returns null and fetches nothing when no accounts are configured', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', '')

    expect(await getContributionCalendar()).toBeNull()
    expect(getGithubContributions).not.toHaveBeenCalled()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('returns null and reports it when an account fails', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat,hubot')
    vi.mocked(getGithubContributions).mockImplementation((login) =>
      login === 'hubot' ? Promise.reject(new Error('not found')) : Promise.resolve(calendar(2))
    )

    expect(await getContributionCalendar()).toBeNull()
    expect(captureException).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledOnce()
  })

  it('returns null and reports it when the calendar fails validation', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat')
    vi.mocked(getGithubContributions).mockResolvedValue(calendar(1.5))

    expect(await getContributionCalendar()).toBeNull()
    expect(captureException).toHaveBeenCalledOnce()
  })

  it('reports a malformed account list instead of fetching', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'not a login')

    expect(await getContributionCalendar()).toBeNull()
    expect(getGithubContributions).not.toHaveBeenCalled()
    expect(captureException).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledOnce()
  })
})
