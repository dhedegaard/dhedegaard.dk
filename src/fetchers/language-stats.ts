import * as z from 'zod/mini'
import type { GithubRepositoryNode } from '../clients/github'

const Share = z.number().check(z.gte(0), z.lte(1))

const LanguageStat = z.object({
  name: z.string().check(z.minLength(1)),
  color: z.nullable(z.string().check(z.minLength(1))),
  share: Share,
  repoCount: z.int().check(z.positive()),
})
interface LanguageStat extends z.infer<typeof LanguageStat> {}

export const LanguageStats = z.object({
  repoCount: z.int().check(z.nonnegative()),
  top: z.array(LanguageStat as z.ZodMiniType<LanguageStat, LanguageStat>),
  other: z.nullable(z.object({ share: Share, names: z.array(z.string().check(z.minLength(1))) })),
})
export interface LanguageStats extends z.infer<typeof LanguageStats> {}

// First occurrence wins when GitHub lists a language id twice.
export const uniqueLanguageEdges = (repo: GithubRepositoryNode) => {
  const seen = new Set<string>()
  return (repo.languages?.edges ?? []).flatMap((edge) => {
    if (edge == null || seen.has(edge.node.id)) {
      return []
    }
    seen.add(edge.node.id)
    return [edge]
  })
}

const TOP_LANGUAGE_COUNT = 10
const MIN_LANGUAGE_SHARE = 0.01

// Markup, data, docs, build, style and shell formats left out of the language stats.
const NON_PROGRAMMING_LANGUAGES: ReadonlySet<string> = new Set([
  'CMake',
  'CSS',
  'Dockerfile',
  'HTML',
  'JSON',
  'Makefile',
  'Markdown',
  'SCSS',
  'Shell',
  'YAML',
])

// Each contributing repo counts once, split by byte share, so one huge repo can't dominate.
export const computeLanguageStats = (repos: readonly GithubRepositoryNode[]): LanguageStats => {
  const totals = new Map<string, LanguageStat>()
  let repoCount = 0
  for (const repo of repos) {
    if (repo.isArchived || repo.isFork) {
      continue
    }
    const edges = uniqueLanguageEdges(repo).filter(
      (edge) => edge.size > 0 && !NON_PROGRAMMING_LANGUAGES.has(edge.node.name)
    )
    if (edges.length === 0) {
      continue
    }
    // Shares are taken of the kept edges' sum, so each repo's shares add up to 1.
    const repoSize = edges.reduce((sum, edge) => sum + edge.size, 0)
    repoCount += 1
    for (const { size, node } of edges) {
      const total = totals.get(node.id) ?? {
        name: node.name,
        color: node.color,
        share: 0,
        repoCount: 0,
      }
      total.share += size / repoSize
      total.repoCount += 1
      totals.set(node.id, total)
    }
  }

  const ranked = [...totals.values()]
    .map((total) => ({ ...total, share: total.share / repoCount }))
    .sort(
      (left, right) =>
        right.share - left.share ||
        right.repoCount - left.repoCount ||
        left.name.localeCompare(right.name)
    )
  // Ranked by share, so the languages above the threshold are a prefix.
  const shownCount = Math.min(
    TOP_LANGUAGE_COUNT,
    ranked.filter((language) => language.share >= MIN_LANGUAGE_SHARE).length
  )
  const rest = ranked.slice(shownCount)
  return {
    repoCount,
    top: ranked.slice(0, shownCount),
    other:
      rest.length === 0
        ? null
        : {
            share: rest.reduce((sum, language) => sum + language.share, 0),
            names: rest.map((language) => language.name),
          },
  }
}
