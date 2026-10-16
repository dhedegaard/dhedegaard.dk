import {
  MONTH_LABELS,
  type ContributionCalendar,
  type ContributionDay,
} from '../fetchers/contribution-calendar'

// GitHub's light-theme greens, from no contributions to the top quartile.
const LEVEL_CLASSES = [
  'bg-[#ebedf0]',
  'bg-[#9be9a8]',
  'bg-[#40c463]',
  'bg-[#30a14e]',
  'bg-[#216e39]',
] as const
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
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

const numberFormat = new Intl.NumberFormat('en-US')

const formatDate = (date: string): string => {
  const day = new Date(`${date}T00:00:00Z`)
  const weekday = WEEKDAY_LABELS[day.getUTCDay()] ?? ''
  const month = MONTH_LABELS[day.getUTCMonth()] ?? ''
  return `${weekday}, ${day.getUTCDate().toString()} ${month} ${day.getUTCFullYear().toString()}`
}

const pluralize = (count: number, noun: string): string =>
  `${numberFormat.format(count)} ${count === 1 ? noun : `${noun}s`}`

const describeDay = ({ date, count }: ContributionDay): string =>
  `${count === 0 ? 'No contributions' : pluralize(count, 'contribution')} on ${formatDate(date)}`

const levelClass = (level: number): string => LEVEL_CLASSES[level] ?? LEVEL_CLASSES[0]

interface ContributionHeatmapProps {
  calendar: ContributionCalendar | null
}
export function ContributionHeatmap({ calendar }: ContributionHeatmapProps) {
  if (calendar == null) {
    return null
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl">Activity</h2>
      {/* Fixed-size cells scroll sideways on phones, opening at the newest weeks (row-reverse); from md up the year fills the width. */}
      <div
        className="flex flex-row-reverse overflow-x-auto [--cell:11px] md:[--cell:minmax(0,1fr)]"
        role="img"
        aria-label={`${pluralize(calendar.total, 'contribution')} over the past year, on ${pluralize(calendar.activeDays, 'day')}`}
      >
        <div
          className="grid flex-none grid-rows-[1.25rem_repeat(7,auto)] gap-[3px] md:flex-auto"
          style={{
            gridTemplateColumns: `2rem repeat(${calendar.weeks.length.toString()}, var(--cell))`,
          }}
        >
          {/* Shares the grid's rows, so the labels line up by construction; sticky keeps them in view. */}
          <div className="sticky left-0 z-10 col-start-1 row-span-full -mr-[3px] grid grid-rows-subgrid bg-white text-[10px] leading-none text-slate-800/60">
            <span className="row-start-2 self-center">Mon</span>
            <span className="row-start-4 self-center">Wed</span>
            <span className="row-start-6 self-center">Fri</span>
          </div>
          {calendar.months.map((month) => (
            <span
              key={month.week}
              className="text-xs whitespace-nowrap text-slate-800/60"
              style={{ gridColumn: month.week + 2, gridRow: 1 }}
            >
              {month.label}
            </span>
          ))}
          {calendar.weeks.map((week, weekIndex) => (
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
        <p>
          {calendar.accountCount > 1
            ? 'Contributions over the past year across my personal and work GitHub accounts, private repos included.'
            : 'Contributions over the past year on GitHub, private repos included.'}
        </p>
        <div className="flex items-center gap-[3px]" aria-hidden="true">
          Less
          {LEVEL_CLASSES.map((className) => (
            <span key={className} className={`size-2.5 rounded-xs ${className}`} />
          ))}
          More
        </div>
      </div>
    </section>
  )
}
