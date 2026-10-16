import { cacheLife } from 'next/cache'
import { getDataAction, getHeatmapWindows } from '../fetchers/data-action'
import { Avatar } from './avatar'
import { ContributionHeatmap } from './contribution-heatmap'
import { FindMeElement } from './find-me-element'
import { LanguageStats } from './language-stats'
import { Repositories } from './repositories'
import { Tagline } from './tagline'
import { TechStack } from './tech-stack'

export default async function Index() {
  'use cache'
  // Refresh hourly; a long expiry keeps serving the last page if GitHub refreshes keep failing.
  cacheLife({ stale: 300, revalidate: 3600, expire: 2_592_000 })
  const [data, windows] = await Promise.all([getDataAction(), getHeatmapWindows(new Date())])

  return (
    <>
      <div className="mt-10 mb-12 flex gap-6">
        <div className="flex flex-auto flex-col gap-4">
          <h1 className="text-5xl">Dennis Hedegaard</h1>
          <Tagline />
          <TechStack />
          <div className="md:hidden">
            <FindMeElement githubUrl={data.githubUrl} email={data.email} />
          </div>
        </div>
        <div className="flex w-32 flex-none flex-col gap-3 self-start max-md:w-[60px]">
          <Avatar src={data.avatarUrl} />
          <div className="max-md:hidden">
            <FindMeElement githubUrl={data.githubUrl} email={data.email} />
          </div>
        </div>
      </div>
      <LanguageStats stats={data.languageStats} />
      <ContributionHeatmap windows={windows} />
      <Repositories repositories={data.repositories} />
    </>
  )
}
