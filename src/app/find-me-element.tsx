import type { DataResult } from '../fetchers/data-action'
import { EnvelopeIcon } from '../icons/envelope'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'

const LINKEDIN_URL = 'https://www.linkedin.com/in/dennis-hedegaard-39a02a22/'

interface FindMeElementProps extends Pick<DataResult, 'githubUrl' | 'email'> {}

export function FindMeElement({ githubUrl, email }: FindMeElementProps) {
  return (
    <div className="animate-slideFindMe flex flex-col gap-3">
      <p className="text-sm text-base-content/60">
        Interested in working together? Browse my work on GitHub, drop me a mail, or find me on
        LinkedIn.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          className="flex items-center gap-1.5 rounded border-2 border-blue-600 bg-blue-600/10 px-3 py-1.5 text-sm text-blue-600 shadow-sm transition-colors hover:bg-blue-600/20 active:bg-blue-600/30 no-underline"
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubIcon className="fill-blue-600" width={14} height={14} />
          <span>GitHub</span>
        </a>
        <a
          className="flex items-center gap-1.5 rounded border border-gray-400 bg-base-content/5 px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-base-content/10 active:bg-base-content/15 no-underline"
          href={`mailto:${email}`}
        >
          <EnvelopeIcon className="fill-current" width={14} height={14} />
          <span>Email</span>
        </a>
        <a
          className="flex items-center gap-1.5 rounded border border-gray-400 bg-base-content/5 px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-base-content/10 active:bg-base-content/15 no-underline"
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkedInIcon className="fill-current" width={14} height={14} />
          <span>LinkedIn</span>
        </a>
      </div>
    </div>
  )
}
