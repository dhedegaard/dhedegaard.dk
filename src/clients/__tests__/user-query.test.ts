import { describe, expect, it } from 'vitest'
import { userQuery } from '../user-query'

describe('userQuery', () => {
  it('fetches repositories with a page size large enough to rank by stars without truncation', () => {
    // The page sorts repositories by star count (and surfaces pinned repos) but
    // fetches them ordered by pushedAt. A high-star or pinned repo that has not
    // been pushed recently must still be fetched, so the page size has to cover
    // all public repos — not just the most recently pushed. 100 is GitHub's max
    // page size; beyond that this query would need pagination.
    expect(userQuery).toMatch(/repositories\([^)]*first:\s*100/)
  })
})
