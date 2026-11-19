import { ContributionHeatmapSkeleton } from './activity-section'
import { AvatarSkeleton } from './avatar'
import { FindMeSkeleton } from './find-me-element'
import { LanguageStatsSkeleton } from './language-stats'
import { PageHeader } from './page-header'
import { RepositoriesSkeleton } from './repositories'
import { parseContributionAccounts } from '../fetchers/contribution-calendar'

// Mirrors page.tsx: shared frames, real static content, skeletons for GitHub data.
export default function Loading() {
  const accounts = parseContributionAccounts(process.env['GITHUB_CONTRIBUTION_ACCOUNTS'])
  // The page hides Activity without accounts.
  const showActivity = accounts.success && accounts.data.length > 0

  return (
    <>
      <PageHeader avatar={<AvatarSkeleton />} findMe={<FindMeSkeleton />} />
      <LanguageStatsSkeleton />
      {showActivity && <ContributionHeatmapSkeleton />}
      <RepositoriesSkeleton />
    </>
  )
}
