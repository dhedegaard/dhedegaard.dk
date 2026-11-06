import { cacheLife } from 'next/cache'
import { getDeployment } from '../deployment'
import { getDataAction, getHeatmapWindows } from '../fetchers/data-action'
import { Avatar } from './avatar'
import { ContributionHeatmap } from './contribution-heatmap'
import { LOCATION } from './about-me-data'
import { About, Education, Experience } from './about-me-sections'
import { FindMeElement } from './find-me-element'
import { LanguageStats } from './language-stats'
import { PrintStamp } from './print-stamp'
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
  const deployment = getDeployment()

  return (
    <>
      <div className="mt-10 mb-12 flex gap-6 print:mt-0 print:mb-8">
        <div className="flex flex-auto flex-col gap-4">
          <h1 className="text-5xl">{SITE_NAME}</h1>
          <div>
            <Tagline />
            <p className="text-sm text-slate-800/60">{LOCATION}</p>
            <PrintStamp deployment={deployment} cachedAt={now} />
          </div>
          <TechStack />
          <div className="md:hidden print:hidden">
            <FindMeElement githubUrl={data.githubUrl} email={data.email} />
          </div>
        </div>
        <div className="flex w-32 flex-none flex-col gap-3 self-start max-md:w-[60px] print:w-auto">
          <div className="print:w-28 print:self-end">
            <Avatar src={data.avatarUrl} />
          </div>
          <div className="max-md:hidden print:block">
            <FindMeElement githubUrl={data.githubUrl} email={data.email} />
          </div>
        </div>
      </div>
      <LanguageStats stats={data.languageStats} />
      <ContributionHeatmap windows={windows} />
      {/* Print only for now; see CLAUDE.md. The last printed section drops its margin. */}
      <About className="hidden print:mb-8 print:block" />
      <Experience className="hidden print:mb-6 print:block" />
      <Education className="hidden print:mb-0 print:block" />
      <Repositories repositories={data.repositories} />
      <SiteFooter deployment={deployment} cachedAt={now} />
    </>
  )
}
