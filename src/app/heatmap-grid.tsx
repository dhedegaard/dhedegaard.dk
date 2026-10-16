import type { HeatmapWindow } from '../fetchers/contribution-calendar'
import {
  formatDay,
  heatmapCaption,
  heatmapSummary,
  heatmapWeeks,
  monthLabels,
  pluralize,
  type HeatmapDay,
} from './heatmap-layout'

// GitHub's light-theme greens, from no contributions to the top quartile.
const LEVEL_CLASSES = [
  'bg-[#ebedf0]',
  'bg-[#9be9a8]',
  'bg-[#40c463]',
  'bg-[#30a14e]',
  'bg-[#216e39]',
] as const
// Literal classes so Tailwind sees them; a week's rows run Monday to Sunday.
const DAY_ROW_CLASSES = [
  'row-start-1',
  'row-start-2',
  'row-start-3',
  'row-start-4',
  'row-start-5',
  'row-start-6',
  'row-start-7',
] as const

const describeDay = ({ date, count }: HeatmapDay): string =>
  `${count === 0 ? 'No contributions' : pluralize(count, 'contribution')} on ${formatDay(date)}`

const levelClass = (level: number): string => LEVEL_CLASSES[level] ?? LEVEL_CLASSES[0]

interface HeatmapGridProps {
  period: HeatmapWindow
  latest: boolean
}
export function HeatmapGrid({ period, latest }: HeatmapGridProps) {
  const weeks = heatmapWeeks(period)

  return (
    <>
      {/* Fixed-size cells scroll sideways on phones, opening at the newest weeks (row-reverse); from md up the year fills the width. */}
      <div
        className="flex flex-row-reverse overflow-x-auto [--cell:11px] md:[--cell:minmax(0,1fr)]"
        role="img"
        aria-label={heatmapSummary(period, latest)}
      >
        <div
          className="grid flex-none grid-rows-[1.25rem_repeat(7,auto)] gap-[3px] md:flex-auto"
          style={{
            gridTemplateColumns: `2rem repeat(${weeks.length.toString()}, var(--cell))`,
          }}
        >
          {/* Shares the grid's rows, so the labels line up by construction; sticky keeps them in view. */}
          <div className="sticky left-0 z-10 col-start-1 row-span-full -mr-[3px] grid grid-rows-subgrid bg-white text-[10px] leading-none text-slate-800/60">
            <span className="row-start-2 self-center">Mon</span>
            <span className="row-start-4 self-center">Wed</span>
            <span className="row-start-6 self-center">Fri</span>
          </div>
          {monthLabels(weeks).map((month) => (
            <span
              key={month.week}
              className="text-xs whitespace-nowrap text-slate-800/60"
              style={{ gridColumn: month.week + 2, gridRow: 1 }}
            >
              {month.label}
            </span>
          ))}
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="row-span-7 row-start-2 grid grid-rows-subgrid *:aspect-square *:rounded-xs *:hover:outline *:hover:outline-slate-800/40"
              style={{ gridColumn: weekIndex + 2 }}
            >
              {week.map((day, dayIndex) =>
                day == null ? null : (
                  <span
                    key={dayIndex}
                    className={`${DAY_ROW_CLASSES[dayIndex] ?? ''} ${levelClass(day.level)}`}
                    title={describeDay(day)}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-800/60">
        <p>{heatmapCaption(period, latest)}</p>
        <div className="flex items-center gap-[3px]" aria-hidden="true">
          Less
          {LEVEL_CLASSES.map((className) => (
            <span key={className} className={`size-2.5 rounded-xs ${className}`} />
          ))}
          More
        </div>
      </div>
    </>
  )
}
