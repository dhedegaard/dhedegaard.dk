import { describe, expect, it } from 'vitest'
import type { GithubUser } from '../../clients/github'
import { transformGithubUserToData } from '../data-action'

type RepositoryEdge = NonNullable<GithubUser['repositories']['edges']>[number]
type RepositoryNode = NonNullable<NonNullable<RepositoryEdge>['node']>
type PinnedItem = NonNullable<GithubUser['pinnedItems']['nodes']>[number]

const makeRepository = ({
  id,
  ...overrides
}: { id: string } & Partial<Omit<RepositoryNode, 'id'>>): RepositoryNode => ({
  id,
  owner: { id: 'user-1' },
  name: id,
  url: `https://github.com/dhedegaard/${id}`,
  pushedAt: '2026-01-01T00:00:00Z',
  description: `${id} description`,
  isArchived: false,
  stargazerCount: 0,
  isPrivate: false,
  homepageUrl: null,
  repositoryTopics: { edges: [] },
  primaryLanguage: null,
  languages: { edges: [] },
  ...overrides,
})

interface MakeUserOptions extends Partial<Omit<GithubUser, 'pinnedItems' | 'repositories'>> {
  pinnedItems?: PinnedItem[] | null
  repositories?: readonly (RepositoryNode | null)[]
  repositoryEdges?: GithubUser['repositories']['edges']
}

const makeUser = ({
  pinnedItems,
  repositories,
  repositoryEdges,
  ...overrides
}: MakeUserOptions = {}): GithubUser => ({
  id: 'user-1',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  url: 'https://github.com/dhedegaard',
  email: 'dennis@example.com',
  pinnedItems: {
    nodes: pinnedItems === undefined ? [] : pinnedItems,
  },
  repositories: {
    edges:
      repositoryEdges ??
      repositories?.map((repository) => ({
        node: repository,
      })) ??
      [],
  },
  ...overrides,
})

describe('transformGithubUserToData', () => {
  it('filters private, archived, and non-owned repositories defensively', () => {
    const publicOwnedRepository = makeRepository({ id: 'public-owned' })
    const data = transformGithubUserToData(
      makeUser({
        repositories: [
          publicOwnedRepository,
          makeRepository({ id: 'private', isPrivate: true }),
          makeRepository({ id: 'archived', isArchived: true }),
          makeRepository({ id: 'not-owned', owner: { id: 'other-user' } }),
        ],
      })
    )

    expect(data.repositories.map((repository) => repository.id)).toEqual(['public-owned'])
  })

  it('keeps pinned repositories first in pinned order', () => {
    const firstPinned = makeRepository({ id: 'first-pinned', stargazerCount: 0 })
    const secondPinned = makeRepository({ id: 'second-pinned', stargazerCount: 100 })
    const unpinned = makeRepository({ id: 'unpinned', stargazerCount: 200 })

    const data = transformGithubUserToData(
      makeUser({
        pinnedItems: [
          { __typename: 'Repository', id: firstPinned.id, name: firstPinned.name },
          { __typename: 'Repository', id: secondPinned.id, name: secondPinned.name },
        ],
        repositories: [unpinned, secondPinned, firstPinned],
      })
    )

    expect(data.repositories.map((repository) => repository.id)).toEqual([
      'first-pinned',
      'second-pinned',
      'unpinned',
    ])
  })

  it('sorts unpinned repositories by stars and then newest pushed date', () => {
    const olderFiveStar = makeRepository({
      id: 'older-five-star',
      stargazerCount: 5,
      pushedAt: '2025-01-01T00:00:00Z',
    })
    const newerFiveStar = makeRepository({
      id: 'newer-five-star',
      stargazerCount: 5,
      pushedAt: '2026-01-01T00:00:00Z',
    })
    const tenStar = makeRepository({
      id: 'ten-star',
      stargazerCount: 10,
      pushedAt: '2024-01-01T00:00:00Z',
    })

    const data = transformGithubUserToData(
      makeUser({ repositories: [olderFiveStar, newerFiveStar, tenStar] })
    )

    expect(data.repositories.map((repository) => repository.id)).toEqual([
      'ten-star',
      'newer-five-star',
      'older-five-star',
    ])
  })

  it('caps rendered repositories at 40', () => {
    const repositories = Array.from({ length: 45 }, (_, index) =>
      makeRepository({
        id: `repo-${index.toString().padStart(2, '0')}`,
        stargazerCount: 45 - index,
      })
    )

    const data = transformGithubUserToData(makeUser({ repositories }))

    expect(data.repositories).toHaveLength(40)
    expect(data.repositories.at(-1)?.id).toBe('repo-39')
  })

  it('normalizes empty profile and repository string values', () => {
    const data = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'normalized',
            description: '',
            homepageUrl: '   ',
          }),
        ],
      })
    )

    expect(data.repositories[0]?.description).toBeNull()
    expect(data.repositories[0]?.homepageUrl).toBeNull()
  })

  it('prefixes homepage URLs that are missing a scheme', () => {
    const data = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'homepage',
            homepageUrl: 'example.com/project',
          }),
        ],
      })
    )

    expect(data.repositories[0]?.homepageUrl).toBe('https://example.com/project')
  })

  it('deduplicates primary language and language edges', () => {
    const data = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'languages',
            primaryLanguage: { id: 'typescript', color: '#3178c6', name: 'TypeScript' },
            languages: {
              edges: [
                null,
                { node: { id: 'typescript', color: '#3178c6', name: 'TypeScript' } },
                { node: { id: 'javascript', color: '#f1e05a', name: 'JavaScript' } },
              ],
            },
          }),
        ],
      })
    )

    expect(data.repositories[0]?.languages).toEqual([
      { id: 'typescript', color: '#3178c6', name: 'TypeScript' },
      { id: 'javascript', color: '#f1e05a', name: 'JavaScript' },
    ])
  })

  it('keeps primary language data when primary and an edge share an id with different color', () => {
    const data = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'first-occurrence',
            primaryLanguage: { id: 'typescript', color: '#3178c6', name: 'TypeScript' },
            languages: {
              edges: [
                { node: { id: 'typescript', color: '#aabbcc', name: 'TypeScript' } },
              ],
            },
          }),
        ],
      })
    )

    expect(data.repositories[0]?.languages).toEqual([
      { id: 'typescript', color: '#3178c6', name: 'TypeScript' },
    ])
  })

  it('keeps first edge data when two edges share an id with different colors', () => {
    const data = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'edge-duplicates',
            primaryLanguage: null,
            languages: {
              edges: [
                { node: { id: 'javascript', color: '#f1e05a', name: 'JavaScript' } },
                { node: { id: 'javascript', color: '#aabbcc', name: 'JavaScript' } },
                { node: { id: 'css', color: '#563d7c', name: 'CSS' } },
              ],
            },
          }),
        ],
      })
    )

    expect(data.repositories[0]?.languages).toEqual([
      { id: 'javascript', color: '#f1e05a', name: 'JavaScript' },
      { id: 'css', color: '#563d7c', name: 'CSS' },
    ])
  })

  it('handles null repository edges, nodes, topic nodes, and language connections', () => {
    const repository = makeRepository({
      id: 'defensive',
      languages: null,
      repositoryTopics: {
        edges: [
          null,
          { node: null },
          { node: { id: 'topic-node', topic: { id: 'topic', name: 'web' } } },
        ],
      },
    })

    const data = transformGithubUserToData(
      makeUser({
        repositoryEdges: [null, { node: null }, { node: repository }],
      })
    )

    expect(data.repositories).toHaveLength(1)
    expect(data.repositories[0]?.languages).toEqual([])
    expect(data.repositories[0]?.topics).toEqual([{ id: 'topic', name: 'web' }])
  })

  it('converts missing, empty, or invalid GitHub public email values to null', () => {
    expect(transformGithubUserToData(makeUser({ email: '' })).email).toBeNull()
    expect(transformGithubUserToData(makeUser({ email: '   ' })).email).toBeNull()
    expect(transformGithubUserToData(makeUser({ email: 'not-an-email' })).email).toBeNull()
  })
})
