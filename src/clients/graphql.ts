import { initGraphQLTada } from 'gql.tada'
import type { introspection } from '../graphql-env.d.ts'

/**
 * Typed `graphql` document builder for the GitHub schema. Types are inferred at
 * compile time from `src/graphql-env.d.ts` (regenerate via `npm run codegen`).
 *
 * GitHub's `URI`/`DateTime` custom scalars are mapped to `string` so document
 * result types line up with the `zod/mini` schema in `github.ts`.
 */
export const graphql = initGraphQLTada<{
  introspection: introspection
  scalars: {
    URI: string
    DateTime: string
  }
}>()

export type { ResultOf } from 'gql.tada'
