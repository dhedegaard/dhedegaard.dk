import { memo } from 'react'
import type { DataResult } from '../fetchers/data-action'
import { EnvelopeIcon } from '../icons/envelope'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'

interface FindMeElementProps extends Pick<DataResult, 'githubUrl' | 'email'> {}

export const FindMeElement = memo<FindMeElementProps>(function FindMeElement({ githubUrl, email }) {
  return (
    <p className="animate-slideFindMe">
      Find me on{' '}
      <a className="text-blue-600" href={githubUrl}>
        <GithubIcon className="inline fill-blue-600" width={16} />
        &nbsp;
        <span>Github</span>
      </a>
      ,{' '}
      <a className="text-blue-600" href="https://www.linkedin.com/in/dennis-hedegaard-39a02a22/">
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
})
