import type { getGithubUser } from '../clients/github'

export type GithubUserData = Awaited<ReturnType<typeof getGithubUser>>
type GithubRepoEdge = GithubUserData['repositories']['edges'] extends
  readonly (infer Edge)[] | null | undefined
  ? Edge
  : never
export type GithubRepoNode = NonNullable<NonNullable<GithubRepoEdge>['node']>

// First occurrence wins when GitHub lists a language id twice.
export const uniqueLanguageEdges = (repo: GithubRepoNode) => {
  const seen = new Set<string>()
  return (repo.languages?.edges ?? []).flatMap((edge) => {
    if (edge == null || seen.has(edge.node.id)) {
      return []
    }
    seen.add(edge.node.id)
    return [edge]
  })
}
