'use client'

import { memo, useMemo } from 'react'
import { useData } from '../fetchers/data-hook'

interface BioElementProps {
  seededBio: string | null
}
export const BioElement = memo<BioElementProps>(function BioElement({ seededBio }) {
  const { data } = useData()
  const bio = useMemo(() => data?.bio ?? seededBio, [data?.bio, seededBio])

  return bio != null && <p className="animate-slideBio">{bio}</p>
})
