import type { ReactNode } from 'react'
import { CELL_SIZE } from './heatmap-grid'
import { BONE } from './skeleton'

interface ActivitySectionProps {
  controls: ReactNode
  children: ReactNode
}

/** The Activity section's frame, shared by the heatmap and the loading skeleton. */
export function ActivitySection({ controls, children }: ActivitySectionProps) {
  return (
    <section className="mb-12 print:hidden">
      {/* Its own heading: the margin sits on the row it shares with the controls. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl">Activity</h2>
        {controls}
      </div>
      {children}
    </section>
  )
}

export function ContributionHeatmapSkeleton() {
  return (
    <ActivitySection controls={<div className={`h-6 w-72 max-w-full rounded ${BONE}`} />}>
      {/* The grid's height: label row plus 7 rows of --cell and their gaps, for a typical 53-week window. */}
      <div className="@container">
        <div
          className={`h-[calc(1.25rem+7*var(--cell)+7*3px)] w-full rounded-md ${CELL_SIZE} ${BONE}`}
          style={{ '--weeks': 53 }}
        />
      </div>
      <div className={`mt-2 h-4 w-96 max-w-full rounded ${BONE}`} />
    </ActivitySection>
  )
}
