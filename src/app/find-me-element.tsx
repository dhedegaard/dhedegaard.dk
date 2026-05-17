import type { DataResult } from '../fetchers/data-action'
import { EnvelopeIcon } from '../icons/envelope'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'

const LINKEDIN_URL = 'https://www.linkedin.com/in/dennis-hedegaard-39a02a22/'

interface FindMeElementProps extends Pick<DataResult, 'githubUrl' | 'email'> {}

export function FindMeElement({ githubUrl, email }: FindMeElementProps) {
  return (
    <p className="animate-slideFindMe">
      Find me on{' '}
      <a className="text-blue-600" href={githubUrl}>
        <GithubIcon className="inline fill-blue-600" width={16} />
        &nbsp;
        <span>Github</span>
      </a>
      ,{' '}
      <a className="text-blue-600" href={LINKEDIN_URL}>
        <LinkedInIcon className="inline fill-blue-600" width={16} />
        &nbsp;
        <span>LinkedIn</span>
      </a>{' '}
      or send me a{' '}
      <a className="text-blue-600" href={`mailto:${email}`}>
        <EnvelopeIcon className="inline w-4 fill-blue-600" width={16} />
        &nbsp;
        <span>mail</span>
      </a>
      .
    </p>
  )
}
