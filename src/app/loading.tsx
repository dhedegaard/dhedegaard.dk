import { ContributionHeatmapSkeleton } from './activity-section'
import { AvatarSkeleton } from './avatar'
import { FindMeSkeleton } from './find-me-element'
import { LanguageStatsSkeleton } from './language-stats'
import { PageHeader } from './page-header'
import { RepositoriesSkeleton } from './repositories'
import { hasContributionAccounts } from '../fetchers/contribution-calendar'

// Mirrors page.tsx: shared frames, real static content, skeletons for GitHub data.
export default function Loading() {
  // Same gate as the page's heatmap fetch.
  const showActivity = hasContributionAccounts()

  return (
    <>
      <PageHeader avatar={<AvatarSkeleton />} findMe={<FindMeSkeleton />} />
      <LanguageStatsSkeleton />
      {showActivity && <ContributionHeatmapSkeleton />}
      <RepositoriesSkeleton />
    </>
  )
}
