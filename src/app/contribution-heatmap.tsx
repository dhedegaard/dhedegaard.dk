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
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const numberFormat = new Intl.NumberFormat('en-US')

const formatDate = (date: string): string => {
  const day = new Date(`${date}T00:00:00Z`)
  const weekday = WEEKDAY_LABELS[(day.getUTCDay() + 6) % 7] ?? ''
  const month = MONTH_LABELS[day.getUTCMonth()] ?? ''
  return `${weekday}, ${day.getUTCDate().toString()} ${month} ${day.getUTCFullYear().toString()}`
}

const describeDay = ({ date, count }: ContributionDay): string =>
  count === 0
    ? `No contributions on ${formatDate(date)}`
    : `${numberFormat.format(count)} ${count === 1 ? 'contribution' : 'contributions'} on ${formatDate(date)}`

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
      {/* Fixed-size cells scroll sideways on phones; from md up the year fills the width. */}
      <div
        className="flex [--cell:11px] md:[--cell:minmax(0,1fr)]"
        role="img"
        aria-label={`${numberFormat.format(calendar.total)} contributions over the past year, on ${numberFormat.format(calendar.activeDays)} days`}
      >
        {/* Outside the scroller, so the labels stay put while the weeks scroll. */}
        <div className="grid w-8 flex-none grid-rows-[1.25rem_repeat(7,11px)] gap-y-[3px] self-start text-[10px] leading-none text-slate-800/60 md:grid-rows-[1.25rem_repeat(7,minmax(0,1fr))] md:self-stretch">
          <span className="row-start-2 self-center">Mon</span>
          <span className="row-start-4 self-center">Wed</span>
          <span className="row-start-6 self-center">Fri</span>
        </div>
        {/* row-reverse makes the scroller open at the newest weeks. */}
        <div className="flex min-w-0 flex-auto flex-row-reverse overflow-x-auto">
          <div
            className="grid flex-none gap-[3px] md:flex-auto"
            style={{
              gridTemplateColumns: `repeat(${calendar.weeks.length.toString()}, var(--cell))`,
              gridTemplateRows: '1.25rem repeat(7, auto)',
            }}
          >
            {calendar.months.map((month) => (
              <span
                key={month.week}
                className="text-xs whitespace-nowrap text-slate-800/60"
                style={{ gridColumn: month.week + 1, gridRow: 1 }}
              >
                {month.label}
              </span>
            ))}
            {calendar.weeks.flatMap((week, weekIndex) =>
              week.map((day, dayIndex) =>
                day == null ? null : (
                  <span
                    key={day.date}
                    className={`block aspect-square rounded-xs hover:outline hover:outline-slate-800/40 ${levelClass(day.level)}`}
                    style={{ gridColumn: weekIndex + 1, gridRow: dayIndex + 2 }}
                    title={describeDay(day)}
                  />
                )
              )
            )}
          </div>
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
