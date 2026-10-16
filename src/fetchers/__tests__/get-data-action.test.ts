import { captureException } from '@sentry/nextjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getGithubContributions,
  getGithubUser,
  type GithubContributions,
  type GithubUser,
} from '../../clients/github'
import { getDataAction } from '../data-action'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('../../clients/github', () => ({ getGithubUser: vi.fn(), getGithubContributions: vi.fn() }))

const user: GithubUser = {
  id: 'user-1',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  url: 'https://github.com/octocat',
  email: 'octocat@example.com',
  pinnedItems: { nodes: [] },
  repositories: { edges: [] },
}

// A one-day calendar on a Monday.
const calendar = (contributionCount: number): GithubContributions => ({
  contributionsCollection: {
    contributionCalendar: {
      weeks: [{ contributionDays: [{ date: '2026-10-12', contributionCount }] }],
    },
  },
})

beforeEach(() => {
  vi.mocked(getGithubUser).mockResolvedValue(user)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getDataAction', () => {
  it('combines the configured accounts into the contribution calendar', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat,hubot')
    vi.mocked(getGithubContributions).mockImplementation((login) =>
      Promise.resolve(calendar(login === 'octocat' ? 2 : 3))
    )

    const data = await getDataAction()

    expect(vi.mocked(getGithubContributions).mock.calls.map(([login]) => login)).toEqual([
      'octocat',
      'hubot',
    ])
    expect(data.contributions?.total).toBe(5)
  })

  it('leaves out the calendar and fetches nothing when no accounts are configured', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', '')

    const data = await getDataAction()

    expect(data.contributions).toBeNull()
    expect(getGithubContributions).not.toHaveBeenCalled()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('keeps the rest of the page and reports it when an account fails', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'octocat,hubot')
    vi.mocked(getGithubContributions).mockImplementation((login) =>
      login === 'hubot' ? Promise.reject(new Error('not found')) : Promise.resolve(calendar(2))
    )

    const data = await getDataAction()

    expect(data.contributions).toBeNull()
    expect(data.githubUrl).toBe(user.url)
    expect(captureException).toHaveBeenCalledOnce()
  })

  it('reports a malformed account list instead of fetching', async () => {
    vi.stubEnv('GITHUB_CONTRIBUTION_ACCOUNTS', 'not a login')

    const data = await getDataAction()

    expect(data.contributions).toBeNull()
    expect(getGithubContributions).not.toHaveBeenCalled()
    expect(captureException).toHaveBeenCalledOnce()
  })
})
