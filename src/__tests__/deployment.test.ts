import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDeployment } from '../deployment'

const SHA = '2acdd4465546d212cd70cd06378cca8e2a8352fb'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getDeployment', () => {
  it('reads the commit and build time inlined at build', () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
    vi.stubEnv('DEPLOYED_AT', '2026-10-16T20:58:12.345Z')

    expect(getDeployment()).toEqual({ sha: SHA, deployedAt: '2026-10-16T20:58:12.345Z' })
  })

  it('is null without a commit, as in local and CI builds', () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '')
    vi.stubEnv('DEPLOYED_AT', '2026-10-16T20:58:12.345Z')

    expect(getDeployment()).toBeNull()
  })

  it.each(['2acdd44', 'not-a-sha', `${SHA}0`])('is null for a malformed commit %j', (sha) => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', sha)
    vi.stubEnv('DEPLOYED_AT', '2026-10-16T20:58:12.345Z')

    expect(getDeployment()).toBeNull()
  })

  it('is null without a build time', () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
    vi.stubEnv('DEPLOYED_AT', '')

    expect(getDeployment()).toBeNull()
  })
})
