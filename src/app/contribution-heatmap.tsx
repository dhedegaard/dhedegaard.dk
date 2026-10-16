import type { HeatmapWindow } from '../fetchers/contribution-calendar'
import { HeatmapGrid } from './heatmap-grid'

interface ContributionHeatmapProps {
  windows: readonly HeatmapWindow[] | null
}
export function ContributionHeatmap({ windows }: ContributionHeatmapProps) {
  const [latest] = windows ?? []
  if (latest == null) {
    return null
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl">Activity</h2>
      <HeatmapGrid period={latest} latest />
    </section>
  )
}
