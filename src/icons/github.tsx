import type { SVGProps } from 'react'
import { siGithub } from 'simple-icons'

export const GithubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d={siGithub.path} />
  </svg>
)
