import * as z from 'zod/mini'

const Deployment = z.object({
  sha: z.string().check(z.regex(/^[0-9a-f]{40}$/)),
  deployedAt: z.iso.datetime(),
})
export interface Deployment extends z.infer<typeof Deployment> {}

/** The deployed commit and build time; null outside Vercel, where there's no commit. */
export const getDeployment = (): Deployment | null => {
  const parsed = Deployment.safeParse({
    // Vercel sets this at build and runtime; it's unset in local and CI builds.
    sha: process.env['VERCEL_GIT_COMMIT_SHA'],
    deployedAt: process.env.DEPLOYED_AT,
  })
  return parsed.success ? parsed.data : null
}
