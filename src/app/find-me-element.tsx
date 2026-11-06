import type { ReactNode } from 'react'
import type { DataResult } from '../fetchers/data-action'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'
import { MailIcon } from '../icons/lucide'
import { LINKEDIN_URL } from './site-meta'

// Printed as plain text links that show their target.
const displayUrl = (url: string): string =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

const baseLinkClass =
  'flex items-center gap-2.5 rounded border px-3 py-1.5 text-sm no-underline shadow-sm transition-colors motion-reduce:transition-none print:gap-1.5 print:border-0 print:bg-transparent print:p-0 print:shadow-none'
const primaryLinkClass = `${baseLinkClass} border-blue-600 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 active:bg-blue-600/30`
const secondaryLinkClass = `${baseLinkClass} border-gray-400 bg-slate-800/5 hover:bg-slate-800/10 active:bg-slate-800/15`

interface FindMeElementProps extends Pick<DataResult, 'githubUrl' | 'email'> {}

export function FindMeElement({ githubUrl, email }: FindMeElementProps) {
  return (
    <div className="flex flex-wrap gap-2 md:flex-col print:gap-x-4 print:gap-y-1">
      <a className={primaryLinkClass} href={githubUrl} target="_blank" rel="me noopener noreferrer">
        <GithubIcon className="fill-blue-600" width={16} height={16} />
        <Label screen="GitHub" print={displayUrl(githubUrl)} />
      </a>
      <a className={secondaryLinkClass} href={`mailto:${email}`}>
        <MailIcon width={16} height={16} />
        <Label screen="Email" print={email} />
      </a>
      <a
        className={secondaryLinkClass}
        href={LINKEDIN_URL}
        target="_blank"
        rel="me noopener noreferrer"
      >
        <LinkedInIcon width={16} height={16} />
        <Label screen="LinkedIn" print={displayUrl(LINKEDIN_URL)} />
      </a>
    </div>
  )
}

interface LabelProps {
  screen: ReactNode
  print: string
}

function Label({ screen, print }: LabelProps) {
  return (
    <>
      <span className="print:hidden">{screen}</span>
      <span className="hidden print:inline">{print}</span>
    </>
  )
}
