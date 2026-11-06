import type { Deployment } from '../deployment'
import { SITE_URL } from '../site'

const SITE_HOST = new URL(SITE_URL).host.replace(/^www\./, '')
const MONTH_FORMAT = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

interface PrintStampProps {
  deployment: Deployment | null
  cachedAt: Date
}

// The last deploy is the closest proxy for when the about-me text last changed.
export function PrintStamp({ deployment, cachedAt }: PrintStampProps) {
  return (
    <p className="hidden text-xs text-slate-800/60 print:block">
      From {SITE_HOST} ·{' '}
      {MONTH_FORMAT.format(deployment == null ? cachedAt : new Date(deployment.deployedAt))}
    </p>
  )
}
