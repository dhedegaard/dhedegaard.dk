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
        Interested in working together? Find me on LinkedIn, drop me a mail, or browse my work on
        GitHub.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          className="flex items-center gap-1.5 rounded-2xl border-2 border-blue-600 px-3 py-1.5 text-sm text-blue-600 no-underline"
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkedInIcon className="fill-blue-600" width={14} height={14} />
          <span>LinkedIn</span>
        </a>
        <a
          className="flex items-center gap-1.5 rounded-2xl border border-gray-400 px-3 py-1.5 text-sm no-underline"
          href={`mailto:${email}`}
        >
          <EnvelopeIcon className="fill-current" width={14} height={14} />
          <span>Email</span>
        </a>
        <a
          className="flex items-center gap-1.5 rounded-2xl border border-gray-400 px-3 py-1.5 text-sm no-underline"
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubIcon className="fill-current" width={14} height={14} />
          <span>GitHub</span>
        </a>
      </div>
    </div>
  )
}
