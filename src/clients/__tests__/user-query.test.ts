import { print } from 'graphql'
import { describe, expect, expectTypeOf, it } from 'vitest'
import type { GithubUser } from '../github'
import type { ResultOf } from '../graphql'
import { userQuery } from '../user-query'

describe('userQuery', () => {
  it('fetches repositories with a page size large enough to rank by stars without truncation', () => {
    // The page sorts repositories by star count (and surfaces pinned repos) but
    // fetches them ordered by pushedAt. A high-star or pinned repo that has not
    // been pushed recently must still be fetched, so the page size has to cover
    // all public repos — not just the most recently pushed. 100 is GitHub's max
    // page size; beyond that this query would need pagination.
    expect(print(userQuery)).toMatch(/repositories\([^)]*first:\s*100/)
  })

  it('selects every field the response schema parses', () => {
    // The reverse of the `satisfies` in github.ts; a missing field fails typecheck.
    expectTypeOf<NonNullable<ResultOf<typeof userQuery>['user']>>().toExtend<GithubUser>()
  })

  it('fetches languages largest first, so the 100-language page drops only the smallest', () => {
    expect(print(userQuery)).toMatch(
      /languages\([^)]*orderBy:\s*\{\s*field:\s*SIZE,\s*direction:\s*DESC\s*\}/
    )
  })
})
