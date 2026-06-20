import { Mail } from 'lucide-react'
import type { DataResult } from '../fetchers/data-action'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'

const LINKEDIN_URL = 'https://www.linkedin.com/in/dennis-hedegaard-39a02a22/'
const baseLinkClass =
  'flex items-center gap-2.5 rounded border px-3 py-1.5 text-sm no-underline shadow-sm transition-colors motion-reduce:transition-none'
const primaryLinkClass = `${baseLinkClass} border-blue-600 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 active:bg-blue-600/30`
const secondaryLinkClass = `${baseLinkClass} border-gray-400 bg-slate-800/5 hover:bg-slate-800/10 active:bg-slate-800/15`

interface FindMeElementProps extends Pick<DataResult, 'githubUrl' | 'email'> {}

export function FindMeElement({ githubUrl, email }: FindMeElementProps) {
  return (
    <div className="flex flex-wrap gap-2 md:flex-col">
      <a
        className={primaryLinkClass}
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <GithubIcon className="fill-blue-600" width={16} height={16} />
        <span>GitHub</span>
      </a>
      {email != null && (
        <a
          className={secondaryLinkClass}
          href={`mailto:${email}`}
        >
          <Mail size={16} />
          <span>Email</span>
        </a>
      )}
      <a
        className={secondaryLinkClass}
        href={LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <LinkedInIcon width={16} height={16} />
        <span>LinkedIn</span>
      </a>
    </div>
  )
}
