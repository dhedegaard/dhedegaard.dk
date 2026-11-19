import type { ReactNode } from 'react'

/** A pulsing placeholder; add a size and a corner radius. */
export const BONE = 'animate-pulse bg-slate-800/10'

interface TextBoneProps {
  children: ReactNode
}

/** Stand-in text, invisible, so the placeholder wraps exactly like real text would. */
export function TextBone({ children }: TextBoneProps) {
  return (
    <span aria-hidden="true" className={`rounded box-decoration-clone text-transparent ${BONE}`}>
      {children}
    </span>
  )
}
