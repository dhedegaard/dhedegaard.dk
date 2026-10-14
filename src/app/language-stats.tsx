import type { LanguageStats as LanguageStatsData } from '../fetchers/data-action'

const formatShare = (share: number): string => `${(share * 100).toFixed(1)}%`

interface Segment {
  key: string
  label: string
  color: string | null
  share: number
  title?: string
}

interface LanguageStatsProps {
  stats: LanguageStatsData
}
export function LanguageStats({ stats }: LanguageStatsProps) {
  if (stats.repoCount === 0) {
    return null
  }

  const segments: Segment[] = stats.top.map(
    (language) =>
      ({
        key: language.name,
        label: language.name,
        color: language.color,
        share: language.share,
      }) satisfies Segment
  )
  if (stats.other != null) {
    segments.push({
      key: 'other',
      label: 'Other',
      color: null,
      share: stats.other.share,
      title: stats.other.names.join(', '),
    } satisfies Segment)
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl">Languages</h2>
      <div
        className="flex h-3 w-full overflow-hidden rounded-md bg-slate-800/10"
        role="img"
        aria-label={`Language share: ${segments
          .map((segment) => `${segment.label} ${formatShare(segment.share)}`)
          .join(', ')}`}
      >
        {segments.map((segment) => (
          <Swatch
            key={segment.key}
            color={segment.color}
            className="h-full basis-0"
            grow={segment.share}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5" title={segment.title}>
            <Swatch color={segment.color} className="size-2.5 rounded-full" />
            {segment.label}
            <span className="text-slate-800/60 tabular-nums">{formatShare(segment.share)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-800/60">
        Share of code across {stats.repoCount} {stats.repoCount === 1 ? 'repo' : 'repos'} (excluding
        forks), each repo weighted equally.
      </p>
    </section>
  )
}

interface SwatchProps {
  color: string | null
  className: string
  grow?: number
}
function Swatch({ color, className, grow }: SwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={color == null ? `${className} bg-slate-400` : className}
      style={{ backgroundColor: color ?? undefined, flexGrow: grow }}
    />
  )
}
