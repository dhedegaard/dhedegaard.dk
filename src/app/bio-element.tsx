interface BioElementProps {
  bio: string | null
}
export function BioElement({ bio }: BioElementProps) {
  return bio != null && <p>{bio}</p>
}
