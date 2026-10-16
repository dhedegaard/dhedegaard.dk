import { print } from 'graphql'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { contributionsQuery } from '../contributions-query'
import type { GithubContributions } from '../github'
import type { ResultOf } from '../graphql'

describe('contributionsQuery', () => {
  it('takes the login as a variable, so no account is hardcoded in the repo', () => {
    expect(print(contributionsQuery)).toMatch(/user\(login:\s*\$login\)/)
  })

  it('selects every field the response schema parses', () => {
    // The reverse of the `satisfies` in github.ts; a missing field fails typecheck.
    expectTypeOf<
      NonNullable<ResultOf<typeof contributionsQuery>['user']>
    >().toExtend<GithubContributions>()
  })
})
