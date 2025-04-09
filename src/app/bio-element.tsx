import { memo } from 'react'

interface BioElementProps {
  bio: string | null
}
export const BioElement = memo<BioElementProps>(function BioElement({ bio }) {
  return bio != null && <p className="animate-slideBio">{bio}</p>
})
