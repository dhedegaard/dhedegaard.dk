'use client'

import { memo, useMemo } from 'react'
import type { DataResult } from '../fetchers/data-action'
import { useData } from '../fetchers/data-hook'
import { EnvelopeIcon } from '../icons/envelope'
import { GithubIcon } from '../icons/github'
import { LinkedInIcon } from '../icons/linkedin'

interface FindMeElementProps {
  seededData: DataResult
}
export const FindMeElement = memo<FindMeElementProps>(function FindMeElement({ seededData }) {
  const { data: freshData } = useData()
  const data = useMemo(() => freshData ?? seededData, [freshData, seededData])

  return (
    <p className="animate-slideFindMe">
      Find me on{' '}
      <a className="text-blue-600" href={data.githubUrl}>
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
      <a className="text-blue-600" href={`mailto:${data.email}`}>
        <EnvelopeIcon className="inline w-4 fill-blue-600" width={16} />
        &nbsp;
        <span>mail</span>
      </a>
      .
    </p>
  )
})
