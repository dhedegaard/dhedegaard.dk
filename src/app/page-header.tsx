import type { ReactNode } from 'react'
import { LOCATION } from './about-me-data'
import { SITE_NAME } from './site-meta'
import { Tagline } from './tagline'
import { TechStack } from './tech-stack'

interface PageHeaderProps {
  avatar: ReactNode
  /** Rendered twice: in a row on phones, beside the avatar from `md` up and in print. */
  findMe: ReactNode
  printStamp?: ReactNode
}

/** The home page header, shared with the loading skeleton so the two can't drift. */
export function PageHeader({ avatar, findMe, printStamp }: PageHeaderProps) {
  return (
    <div className="mt-10 mb-12 flex gap-6 print:mt-0 print:mb-8">
      <div className="flex flex-auto flex-col gap-4">
        <h1 className="text-5xl">{SITE_NAME}</h1>
        <div>
          <Tagline />
          <p className="text-sm text-slate-800/60">{LOCATION}</p>
          {printStamp}
        </div>
        <TechStack />
        <div className="md:hidden print:hidden">{findMe}</div>
      </div>
      <div className="flex w-32 flex-none flex-col gap-3 self-start max-md:w-[60px] print:w-auto">
        <div className="print:w-28 print:self-end">{avatar}</div>
        <div className="max-md:hidden print:block">{findMe}</div>
      </div>
    </div>
  )
}
