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
  vi.useRealTimers()
})

const validUser = {
  id: 'U_1',
  avatarUrl: 'https://example.com/avatar.png',
  url: 'https://github.com/octocat',
  email: '',
  pinnedItems: { nodes: [] },
  repositories: { edges: [] },
}
const userResponse = () => Response.json({ data: { user: validUser } })
const statusResponse = (status: number) => new Response('nope', { status, statusText: 'Failed' })

describe('getGithubUser', () => {
  it('throws when GITHUB_PAT is missing', async () => {
    delete process.env['GITHUB_PAT']

    await expect(getGithubUser()).rejects.toThrow('GITHUB_PAT is not set')
  })

  it('throws on non-OK HTTP responses', async () => {
    vi.useFakeTimers()
    process.env['GITHUB_PAT'] = 'token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('nope', { status: 500, statusText: 'Server Error' }))
    )

    const assertion = expect(getGithubUser()).rejects.toThrow('500: Server Error')
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
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

describe('postGithubQuery retries (via getGithubUser)', () => {
  it('retries once after a 502 and returns the second response', async () => {
    vi.useFakeTimers()
    process.env['GITHUB_PAT'] = 'token'
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(statusResponse(502))
      .mockResolvedValueOnce(userResponse())
    vi.stubGlobal('fetch', fetchMock)

    const result = getGithubUser()
    await vi.advanceTimersByTimeAsync(1000)

    await expect(result).resolves.toMatchObject({ id: 'U_1' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries once after a network error', async () => {
    vi.useFakeTimers()
    process.env['GITHUB_PAT'] = 'token'
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(userResponse())
    vi.stubGlobal('fetch', fetchMock)

    const result = getGithubUser()
    await vi.advanceTimersByTimeAsync(1000)

    await expect(result).resolves.toMatchObject({ id: 'U_1' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each([403, 429, 500, 502])('retries a %i once', async (status) => {
    vi.useFakeTimers()
    process.env['GITHUB_PAT'] = 'token'
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(statusResponse(status))
      .mockResolvedValueOnce(userResponse())
    vi.stubGlobal('fetch', fetchMock)

    const result = getGithubUser()
    await vi.advanceTimersByTimeAsync(1000)

    await expect(result).resolves.toMatchObject({ id: 'U_1' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('gives up after the second failure', async () => {
    vi.useFakeTimers()
    process.env['GITHUB_PAT'] = 'token'
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(statusResponse(503))
      .mockResolvedValueOnce(statusResponse(503))
    vi.stubGlobal('fetch', fetchMock)

    const assertion = expect(getGithubUser()).rejects.toThrow('503')
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  // These two pass before the change on purpose: they pin what must not be retried.
  it('does not retry a 401', async () => {
    vi.useFakeTimers()
    process.env['GITHUB_PAT'] = 'token'
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(statusResponse(401))
    vi.stubGlobal('fetch', fetchMock)

    const assertion = expect(getGithubUser()).rejects.toThrow('401')
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not retry GraphQL errors', async () => {
    vi.useFakeTimers()
    process.env['GITHUB_PAT'] = 'token'
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ errors: [{ message: 'Bad' }], data: null }))
    vi.stubGlobal('fetch', fetchMock)

    const assertion = expect(getGithubUser()).rejects.toThrow('Error in Github response')
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('gives each request a 10 s timeout', async () => {
    process.env['GITHUB_PAT'] = 'token'
    const signal = new AbortController().signal
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal)
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(userResponse())
    vi.stubGlobal('fetch', fetchMock)

    await getGithubUser()

    expect(timeoutSpy).toHaveBeenCalledWith(10_000)
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(signal)
    timeoutSpy.mockRestore()
  })
})

describe('getGithubContributions', () => {
  const range = { from: '2025-10-17T00:00:00Z', to: '2026-10-16T23:59:59Z' }

  it('sends the login and window as query variables and parses the calendar', async () => {
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
              contributionYears: [2026, 2025],
              contributionCalendar: { weeks: [{ contributionDays: days }] },
            },
          },
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getGithubContributions('octocat', { from: 'F', to: 'T' })

    const rawBody = fetchMock.mock.calls[0]?.[1]?.body
    // A non-string body parses as '' and fails the test.
    const body: unknown = JSON.parse(typeof rawBody === 'string' ? rawBody : '')
    expect(body).toMatchObject({ variables: { login: 'octocat', from: 'F', to: 'T' } })
    expect(result.contributionsCollection.contributionYears).toEqual([2026, 2025])
    expect(result.contributionsCollection.contributionCalendar.weeks).toEqual([
      { contributionDays: days },
    ])
  })

  it('rejects a count that is not a whole number', async () => {
    process.env['GITHUB_PAT'] = 'token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          data: {
            user: {
              contributionsCollection: {
                contributionYears: [2026],
                contributionCalendar: {
                  weeks: [{ contributionDays: [{ date: '2026-10-12', contributionCount: 1.5 }] }],
                },
              },
            },
          },
        })
      )
    )

    await expect(getGithubContributions('octocat', range)).rejects.toThrow()
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

    await expect(getGithubContributions('nobody', range)).rejects.toThrow(
      'Error in Github response'
    )
  })
})
