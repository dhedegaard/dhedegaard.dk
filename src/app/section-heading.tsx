import type { ReactNode } from 'react'

interface SectionHeadingProps {
  children: ReactNode
}

export function SectionHeading({ children }: SectionHeadingProps) {
  return <h2 className="mb-4 text-xl">{children}</h2>
}
