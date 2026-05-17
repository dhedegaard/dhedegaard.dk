import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGithubUser } from '../github'

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
})
