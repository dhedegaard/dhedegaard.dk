import { cacheLife } from 'next/cache'
import { getDeployment } from '../deployment'
import { getDataAction, getHeatmapWindows } from '../fetchers/data-action'
import { Avatar } from './avatar'
import { ContributionHeatmap } from './contribution-heatmap'
import { LOCATION } from './about-me-data'
import { About, Education, Experience } from './about-me-sections'
import { FindMeElement } from './find-me-element'
import { LanguageStats } from './language-stats'
import { Repositories } from './repositories'
import { SITE_NAME } from './site-meta'
import { SiteFooter } from './site-footer'
import { Tagline } from './tagline'
import { TechStack } from './tech-stack'

export default async function Index() {
  'use cache'
  // Refresh hourly; a long expiry keeps serving the last page if GitHub refreshes keep failing.
  cacheLife({ stale: 300, revalidate: 3600, expire: 2_592_000 })
  // Read once inside the cache scope: it's when this cached page was generated.
  const now = new Date()
  const [data, windows] = await Promise.all([getDataAction(), getHeatmapWindows(now)])

  return (
    <>
      <div className="mt-10 mb-12 flex gap-6">
        <div className="flex flex-auto flex-col gap-4">
          <h1 className="text-5xl">{SITE_NAME}</h1>
          <div>
            <Tagline />
            <p className="text-sm text-slate-800/60">{LOCATION}</p>
          </div>
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
      {/* Print only for now; see CLAUDE.md. */}
      <div className="hidden print:block">
        <About />
        <Experience />
        <Education />
      </div>
      <Repositories repositories={data.repositories} />
      <SiteFooter deployment={getDeployment()} cachedAt={now} />
    </>
  )
}
