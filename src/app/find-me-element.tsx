import type { DataResult } from '../fetchers/data-action'
import { EnvelopeIcon } from '../icons/envelope'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'

const LINKEDIN_URL = 'https://www.linkedin.com/in/dennis-hedegaard-39a02a22/'

interface FindMeElementProps extends Pick<DataResult, 'githubUrl' | 'email'> {}

export function FindMeElement({ githubUrl, email }: FindMeElementProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base-content/60 text-sm">
        Interested in working together? Browse my work on GitHub
        {email != null ? ', drop me a mail,' : ''} or find me on LinkedIn.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          className="flex items-center gap-1.5 rounded border border-blue-600 bg-blue-600/10 px-3 py-1.5 text-sm text-blue-600 no-underline shadow-sm transition-colors motion-reduce:transition-none hover:bg-blue-600/20 active:bg-blue-600/30"
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubIcon className="fill-blue-600" width={14} height={14} />
          <span>GitHub</span>
        </a>
        {email != null && (
          <a
            className="bg-base-content/5 hover:bg-base-content/10 active:bg-base-content/15 flex items-center gap-1.5 rounded border border-gray-400 px-3 py-1.5 text-sm no-underline shadow-sm transition-colors motion-reduce:transition-none"
            href={`mailto:${email}`}
          >
            <EnvelopeIcon className="fill-current" width={14} height={14} />
            <span>Email</span>
          </a>
        )}
        <a
          className="bg-base-content/5 hover:bg-base-content/10 active:bg-base-content/15 flex items-center gap-1.5 rounded border border-gray-400 px-3 py-1.5 text-sm no-underline shadow-sm transition-colors motion-reduce:transition-none"
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
