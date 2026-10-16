import type { Deployment } from '../deployment'

const REPOSITORY_URL = 'https://github.com/dhedegaard/dhedegaard.dk'
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const
const LINK_CLASS = 'text-inherit underline decoration-slate-800/30 hover:text-slate-800'

// The page is prebuilt, so times are shown in UTC rather than the visitor's timezone.
const formatUtc = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getUTCDate().toString()} ${MONTHS[date.getUTCMonth()] ?? ''} ${date.getUTCFullYear().toString()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
}

interface SiteFooterProps {
  deployment: Deployment | null
  cachedAt: Date
}
export function SiteFooter({ deployment, cachedAt }: SiteFooterProps) {
  return (
    <footer className="mb-10 text-xs text-slate-800/60">
      <p>
        {deployment != null && (
          <>
            Deployed {formatUtc(new Date(deployment.deployedAt))} from{' '}
            <a
              className={`font-mono ${LINK_CLASS}`}
              href={`${REPOSITORY_URL}/commit/${deployment.sha}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {deployment.sha.slice(0, 7)}
            </a>
            {' · '}
          </>
        )}
        Data cached from {formatUtc(cachedAt)}
        {' · '}
        <a className={LINK_CLASS} href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
          Source
        </a>
      </p>
    </footer>
  )
}
