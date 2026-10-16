import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGithubContributions, getGithubUser } from '../github'

const originalGithubPat = process.env['GITHUB_PAT']

afterEach(() => {
  if (originalGithubPat === undefined) {
    delete process.env['GITHUB_PAT']
  } else {
    process.env['GITHUB_PAT'] = originalGithubPat
  }
  vi.unstubAllGlobals()
})

describe('getGithubUser', () => {
  it('throws when GITHUB_PAT is missing', async () => {
    delete process.env['GITHUB_PAT']

    await expect(getGithubUser()).rejects.toThrow('GITHUB_PAT is not set')
  })

  it('throws on non-OK HTTP responses', async () => {
    process.env['GITHUB_PAT'] = 'token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('nope', { status: 500, statusText: 'Server Error' }))
    )

    await expect(getGithubUser()).rejects.toThrow('500: Server Error')
  })

  it('throws on GraphQL errors', async () => {
    process.env['GITHUB_PAT'] = 'token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          errors: [{ message: 'Bad credentials' }],
          data: { user: null },
        })
      )
    )

    await expect(getGithubUser()).rejects.toThrow('Error in Github response')
  })

  it('throws when data.user is missing', async () => {
    process.env['GITHUB_PAT'] = 'token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          data: { user: null },
        })
      )
    )

    await expect(getGithubUser()).rejects.toThrow('Github user was not found')
  })

  it('throws a clear error on a 200 response that has no data field', async () => {
    process.env['GITHUB_PAT'] = 'token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ message: 'API rate limit exceeded' }))
    )

    await expect(getGithubUser()).rejects.toThrow('Malformed Github response')
  })
})

describe('getGithubContributions', () => {
  it('sends the login as a query variable and parses the calendar', async () => {
    process.env['GITHUB_PAT'] = 'token'
    const days = [
      { date: '2026-10-12', contributionCount: 0 },
      { date: '2026-10-13', contributionCount: 4 },
    ]
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: { weeks: [{ contributionDays: days }] },
            },
          },
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getGithubContributions('octocat')

    const rawBody = fetchMock.mock.calls[0]?.[1]?.body
    // A non-string body parses as '' and fails the test.
    const body: unknown = JSON.parse(typeof rawBody === 'string' ? rawBody : '')
    expect(body).toMatchObject({ variables: { login: 'octocat' } })
    expect(result.contributionsCollection.contributionCalendar.weeks).toEqual([
      { contributionDays: days },
    ])
  })

  it('throws when the account does not exist', async () => {
    process.env['GITHUB_PAT'] = 'token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          errors: [
            {
              type: 'NOT_FOUND',
              message: "Could not resolve to a User with the login of 'nobody'.",
            },
          ],
          data: { user: null },
        })
      )
    )

    await expect(getGithubContributions('nobody')).rejects.toThrow('Error in Github response')
  })
})
