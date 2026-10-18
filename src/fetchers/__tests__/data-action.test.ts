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
  isFork: false,
  stargazerCount: 0,
  isPrivate: false,
  homepageUrl: null,
  repositoryTopics: { edges: [] },
  primaryLanguage: null,
  languages: { edges: [] },
  ...overrides,
})

// Raw GitHub language fields from a name → byte-size map; the first entry is the primary language.
const withLanguages = (
  sizes: Record<string, number>,
  colors: Record<string, string> = {}
): Pick<RepositoryNode, 'primaryLanguage' | 'languages'> => {
  const entries = Object.entries(sizes)
  const node = (name: string) => ({ id: name, name, color: colors[name] ?? null })
  const first = entries[0]
  return {
    primaryLanguage: first == null ? null : node(first[0]),
    languages: {
      edges: entries.map(([name, size]) => ({ size, node: node(name) })),
    },
  }
}

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
  it('filters private and non-owned repositories defensively', () => {
    const publicOwnedRepository = makeRepository({ id: 'public-owned' })
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          publicOwnedRepository,
          makeRepository({ id: 'private', isPrivate: true }),
          makeRepository({ id: 'not-owned', owner: { id: 'other-user' } }),
        ],
      })
    )

    expect(data.repositories.map((repository) => repository.id)).toEqual(['public-owned'])
  })

  it('keeps archived repositories and flags them', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'active' }),
          makeRepository({ id: 'archived', isArchived: true }),
        ],
      })
    )

    expect(
      data.repositories.map((repository) => [repository.id, repository.archived] as const)
    ).toEqual([
      ['active', false],
      ['archived', true],
    ])
  })

  it('sorts archived repositories last, even when pinned or starred', () => {
    const archivedPinned = makeRepository({ id: 'archived-pinned', isArchived: true })
    const archivedStarred = makeRepository({
      id: 'archived-starred',
      isArchived: true,
      stargazerCount: 100,
    })
    const pinned = makeRepository({ id: 'pinned' })
    const active = makeRepository({ id: 'active', stargazerCount: 1 })

    const { data } = transformGithubUserToData(
      makeUser({
        pinnedItems: [
          { __typename: 'Repository', id: archivedPinned.id, name: archivedPinned.name },
          { __typename: 'Repository', id: pinned.id, name: pinned.name },
        ],
        repositories: [archivedStarred, archivedPinned, active, pinned],
      })
    )

    expect(data.repositories.map((repository) => repository.id)).toEqual([
      'pinned',
      'active',
      'archived-pinned',
      'archived-starred',
    ])
  })

  it('keeps pinned repositories first in pinned order', () => {
    const firstPinned = makeRepository({ id: 'first-pinned', stargazerCount: 0 })
    const secondPinned = makeRepository({ id: 'second-pinned', stargazerCount: 100 })
    const unpinned = makeRepository({ id: 'unpinned', stargazerCount: 200 })

    const { data } = transformGithubUserToData(
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

    const { data } = transformGithubUserToData(
      makeUser({ repositories: [olderFiveStar, newerFiveStar, tenStar] })
    )

    expect(data.repositories.map((repository) => repository.id)).toEqual([
      'ten-star',
      'newer-five-star',
      'older-five-star',
    ])
  })

  it('orders the pushedAt tiebreak chronologically across timezone offsets', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          // 10:00 UTC, but lexically the larger string
          makeRepository({
            id: 'plus-two',
            stargazerCount: 5,
            pushedAt: '2026-01-01T12:00:00+02:00',
          }),
          // 11:00 UTC — chronologically newer, lexically the smaller string
          makeRepository({ id: 'utc', stargazerCount: 5, pushedAt: '2026-01-01T11:00:00Z' }),
        ],
      })
    )

    expect(data.repositories.map((repository) => repository.id)).toEqual(['utc', 'plus-two'])
  })

  it('renders every repository without a cap', () => {
    const repositories = Array.from({ length: 45 }, (_, index) =>
      makeRepository({
        id: `repo-${index.toString().padStart(2, '0')}`,
        stargazerCount: 45 - index,
      })
    )

    const { data } = transformGithubUserToData(makeUser({ repositories }))

    expect(data.repositories).toHaveLength(45)
    expect(data.repositories.at(-1)?.id).toBe('repo-44')
  })

  it('normalizes empty profile and repository string values', () => {
    const { data } = transformGithubUserToData(
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
    const { data } = transformGithubUserToData(
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
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'languages',
            primaryLanguage: { id: 'typescript', color: '#3178c6', name: 'TypeScript' },
            languages: {
              edges: [
                null,
                { size: 80, node: { id: 'typescript', color: '#3178c6', name: 'TypeScript' } },
                { size: 20, node: { id: 'javascript', color: '#f1e05a', name: 'JavaScript' } },
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
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'first-occurrence',
            primaryLanguage: { id: 'typescript', color: '#3178c6', name: 'TypeScript' },
            languages: {
              edges: [
                { size: 10, node: { id: 'typescript', color: '#aabbcc', name: 'TypeScript' } },
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
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'edge-duplicates',
            primaryLanguage: null,
            languages: {
              edges: [
                { size: 60, node: { id: 'javascript', color: '#f1e05a', name: 'JavaScript' } },
                { size: 5, node: { id: 'javascript', color: '#aabbcc', name: 'JavaScript' } },
                { size: 35, node: { id: 'lua', color: '#000080', name: 'Lua' } },
              ],
            },
          }),
        ],
      })
    )

    expect(data.repositories[0]?.languages).toEqual([
      { id: 'javascript', color: '#f1e05a', name: 'JavaScript' },
      { id: 'lua', color: '#000080', name: 'Lua' },
    ])
    expect(data.languageStats.top).toEqual([
      { name: 'JavaScript', color: '#f1e05a', share: 60 / 95, repoCount: 1 },
      { name: 'Lua', color: '#000080', share: 35 / 95, repoCount: 1 },
    ])
  })

  it('weights each repository equally in languageStats', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'big',
            ...withLanguages({ TypeScript: 900_000, Lua: 100_000 }, { TypeScript: '#3178c6' }),
          }),
          makeRepository({ id: 'small', ...withLanguages({ Rust: 10 }) }),
        ],
      })
    )

    expect(data.languageStats).toEqual({
      repoCount: 2,
      top: [
        { name: 'Rust', color: null, share: 0.5, repoCount: 1 },
        { name: 'TypeScript', color: '#3178c6', share: 0.45, repoCount: 1 },
        { name: 'Lua', color: null, share: 0.05, repoCount: 1 },
      ],
      other: null,
    })
  })

  it('excludes archived, forked, filtered, and language-less repositories from languageStats only', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'active', ...withLanguages({ TypeScript: 10 }) }),
          makeRepository({ id: 'archived', isArchived: true, ...withLanguages({ Go: 10 }) }),
          makeRepository({ id: 'fork', isFork: true, ...withLanguages({ Lua: 10_000_000 }) }),
          makeRepository({ id: 'private', isPrivate: true, ...withLanguages({ Java: 10 }) }),
          makeRepository({ id: 'no-languages' }),
          makeRepository({
            id: 'zero-size',
            primaryLanguage: { id: 'c', color: null, name: 'C' },
            languages: { edges: [{ size: 0, node: { id: 'c', color: null, name: 'C' } }] },
          }),
        ],
      })
    )

    expect(data.languageStats).toEqual({
      repoCount: 1,
      top: [{ name: 'TypeScript', color: null, share: 1, repoCount: 1 }],
      other: null,
    })
    expect(data.repositories.map((repository) => repository.id).sort()).toEqual([
      'active',
      'archived',
      'fork',
      'no-languages',
      'zero-size',
    ])
  })

  it('returns empty languageStats when no repository contributes', () => {
    const { data } = transformGithubUserToData(
      makeUser({ repositories: [makeRepository({ id: 'no-languages' })] })
    )

    expect(data.languageStats).toEqual({ repoCount: 0, top: [], other: null })
  })

  it('leaves data and build formats out of languageStats', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'app', ...withLanguages({ Go: 300, Dockerfile: 100 }) }),
          makeRepository({ id: 'docs', ...withLanguages({ Markdown: 100, YAML: 50 }) }),
        ],
      })
    )

    expect(data.languageStats.repoCount).toBe(1)
    expect(data.languageStats.top.map((language) => [language.name, language.share])).toEqual([
      ['Go', 1],
    ])
    expect(
      data.repositories.find((repo) => repo.id === 'app')?.languages.map((l) => l.name)
    ).toEqual(['Go', 'Dockerfile'])
  })

  it('keeps the top 10 languages and folds the rest into other', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    const repositories = names.map((name) =>
      makeRepository({ id: `repo-${name}`, ...withLanguages({ [name]: 1 }) })
    )

    const { data } = transformGithubUserToData(makeUser({ repositories }))

    expect(data.languageStats.top.map((language) => language.name)).toEqual(names.slice(0, 10))
    expect(data.languageStats.other?.names).toEqual(['K', 'L'])
    expect(data.languageStats.other?.share).toBeCloseTo(2 / 12)
  })

  it('breaks share ties by repo count, then by name', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'a', ...withLanguages({ A: 10 }) }),
          makeRepository({ id: 'bc', ...withLanguages({ B: 5, C: 5 }) }),
          makeRepository({ id: 'bd', ...withLanguages({ B: 5, D: 5 }) }),
        ],
      })
    )

    expect(data.languageStats.top.map((language) => [language.name, language.repoCount])).toEqual([
      ['B', 2],
      ['A', 1],
      ['C', 1],
      ['D', 1],
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

    const { data } = transformGithubUserToData(
      makeUser({
        repositoryEdges: [null, { node: null }, { node: repository }],
      })
    )

    expect(data.repositories).toHaveLength(1)
    expect(data.repositories[0]?.languages).toEqual([])
    expect(data.repositories[0]?.topics).toEqual([{ id: 'topic', name: 'web' }])
  })

  it('drops a topic that repeats the repository name', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({
            id: 'repo-1',
            name: 'Tetris',
            repositoryTopics: {
              edges: [
                { node: { id: 'n1', topic: { id: 't1', name: 'tetris' } } },
                { node: { id: 'n2', topic: { id: 't2', name: 'react' } } },
              ],
            },
          }),
        ],
      })
    )

    expect(data.repositories[0]?.topics).toEqual([{ id: 't2', name: 'react' }])
  })

  it('converts missing, empty, or invalid GitHub public email values to null', () => {
    expect(transformGithubUserToData(makeUser({ email: '' })).data.email).toBeNull()
    expect(transformGithubUserToData(makeUser({ email: '   ' })).data.email).toBeNull()
    expect(transformGithubUserToData(makeUser({ email: 'not-an-email' })).data.email).toBeNull()
  })

  it('keeps a repository but nulls a homepage that cannot become a valid URL', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'spaces', homepageUrl: 'my site.com' }),
          makeRepository({ id: 'scheme-only', homepageUrl: 'http://' }),
        ],
      })
    )

    const byId = Object.fromEntries(
      data.repositories.map((repository) => [repository.id, repository])
    )
    expect(data.repositories.map((repository) => repository.id).sort()).toEqual([
      'scheme-only',
      'spaces',
    ])
    expect(byId['spaces']?.homepageUrl).toBeNull()
    expect(byId['scheme-only']?.homepageUrl).toBeNull()
  })

  it('nulls non-http(s) homepage schemes instead of rendering a broken link', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'mailto', homepageUrl: 'mailto:me@example.com' }),
          makeRepository({ id: 'ftp', homepageUrl: 'ftp://files.example.com' }),
          makeRepository({ id: 'javascript', homepageUrl: 'javascript:alert(1)' }),
        ],
      })
    )

    const byId = Object.fromEntries(
      data.repositories.map((repository) => [repository.id, repository])
    )
    expect(byId['mailto']?.homepageUrl).toBeNull()
    expect(byId['ftp']?.homepageUrl).toBeNull()
    expect(byId['javascript']?.homepageUrl).toBeNull()
  })

  it('normalizes a protocol-relative homepage URL to https', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'protocol-relative', homepageUrl: '//example.com/path' }),
        ],
      })
    )

    expect(data.repositories[0]?.homepageUrl).toBe('https://example.com/path')
  })

  it('prefixes scheme-less host:port homepage URLs instead of dropping them', () => {
    const { data } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'host-port', homepageUrl: 'example.com:8080' }),
          makeRepository({ id: 'localhost-port', homepageUrl: 'localhost:3000/path' }),
        ],
      })
    )

    const byId = Object.fromEntries(
      data.repositories.map((repository) => [repository.id, repository])
    )
    expect(byId['host-port']?.homepageUrl).toBe('https://example.com:8080')
    expect(byId['localhost-port']?.homepageUrl).toBe('https://localhost:3000/path')
  })

  it('drops a repository that fails schema validation and reports it in dropped', () => {
    const { data, dropped } = transformGithubUserToData(
      makeUser({
        repositories: [
          makeRepository({ id: 'good' }),
          makeRepository({
            id: 'empty-topic',
            repositoryTopics: {
              edges: [{ node: { id: 'topic-node', topic: { id: 'topic', name: '' } } }],
            },
          }),
        ],
      })
    )

    expect(data.repositories.map((repository) => repository.id)).toEqual(['good'])
    expect(dropped.map((entry) => entry.id)).toEqual(['empty-topic'])
  })

  it('reports no dropped repositories when every repository is valid', () => {
    const { dropped } = transformGithubUserToData(
      makeUser({ repositories: [makeRepository({ id: 'a' }), makeRepository({ id: 'b' })] })
    )

    expect(dropped).toEqual([])
  })
})
