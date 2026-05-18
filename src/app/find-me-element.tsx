import type { DataResult } from '../fetchers/data-action'
import { EnvelopeIcon } from '../icons/envelope'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'

const LINKEDIN_URL = 'https://www.linkedin.com/in/dennis-hedegaard-39a02a22/'

interface FindMeElementProps extends Pick<DataResult, 'githubUrl' | 'email'> {}

export function FindMeElement({ githubUrl, email }: FindMeElementProps) {
  return (
    <div className="flex flex-wrap gap-2 md:flex-col">
      <a
        className="flex items-center gap-2.5 rounded border border-blue-600 bg-blue-600/10 px-3 py-1.5 text-sm text-blue-600 no-underline shadow-sm transition-colors motion-reduce:transition-none hover:bg-blue-600/20 active:bg-blue-600/30"
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <GithubIcon className="fill-blue-600" width={16} height={16} />
        <span>GitHub</span>
      </a>
      {email != null && (
        <a
          className="bg-base-content/5 hover:bg-base-content/10 active:bg-base-content/15 flex items-center gap-2.5 rounded border border-gray-400 px-3 py-1.5 text-sm no-underline shadow-sm transition-colors motion-reduce:transition-none"
          href={`mailto:${email}`}
        >
          <EnvelopeIcon className="fill-current" width={16} height={16} />
          <span>Email</span>
        </a>
      )}
      <a
        className="bg-base-content/5 hover:bg-base-content/10 active:bg-base-content/15 flex items-center gap-2.5 rounded border border-gray-400 px-3 py-1.5 text-sm no-underline shadow-sm transition-colors motion-reduce:transition-none"
        href={LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <LinkedInIcon className="fill-current" width={16} height={16} />
        <span>LinkedIn</span>
      </a>
    </div>
  )
}
