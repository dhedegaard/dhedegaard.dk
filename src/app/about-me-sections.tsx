import { Fragment, type ReactNode } from 'react'
import { Badge } from './badge'
import { ABOUT, type Degree, EDUCATION, EXPERIENCE, SPOKEN_LANGUAGES } from './about-me-data'
import { SectionHeading } from './section-heading'

interface SectionProps {
  className?: string
}

export function About({ className }: SectionProps) {
  return (
    <section className={`mb-12 ${className ?? ''}`}>
      <HeadedList heading="About" gapClassName="gap-3">
        {ABOUT.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </HeadedList>
    </section>
  )
}

export function Experience({ className }: SectionProps) {
  return (
    <section className={`mb-12 ${className ?? ''}`}>
      <HeadedList heading="Experience" gapClassName="gap-6">
        {EXPERIENCE.map((job) => (
          <JobEntry key={job.period} job={job} />
        ))}
      </HeadedList>
    </section>
  )
}

export function Education({ className }: SectionProps) {
  return (
    <section className={`mb-12 ${className ?? ''}`}>
      <HeadedList heading="Education" gapClassName="gap-4">
        {EDUCATION.map((entry) => (
          <EducationEntry key={entry.period} entry={entry} />
        ))}
      </HeadedList>
      <div className="mt-6 print:break-inside-avoid">
        <h3 className="mb-1 font-semibold">Spoken languages</h3>
        <p className="text-sm">{SPOKEN_LANGUAGES}</p>
      </div>
    </section>
  )
}

interface HeadedListProps {
  heading: string
  // A static Tailwind gap class, e.g. "gap-6".
  gapClassName: string
  children: readonly ReactNode[]
}

// Wraps the heading with the first item so a printed page never ends on a bare heading.
function HeadedList({ heading, gapClassName, children }: HeadedListProps) {
  const [first, ...rest] = children
  return (
    <div className={`flex flex-col ${gapClassName}`}>
      <div className="print:break-inside-avoid">
        <SectionHeading>{heading}</SectionHeading>
        {first}
      </div>
      {rest}
    </div>
  )
}

interface EntryHeaderProps {
  title: ReactNode
  period: string
}

function EntryHeader({ title, period }: EntryHeaderProps) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
      <h3 className="font-semibold">{title}</h3>
      <span className="shrink-0 text-sm text-slate-800/60 tabular-nums">{period}</span>
    </div>
  )
}

interface JobEntryProps {
  job: (typeof EXPERIENCE)[number]
}

function JobEntry({ job }: JobEntryProps) {
  return (
    <article className="flex flex-col gap-2 print:break-inside-avoid">
      <EntryHeader
        period={job.period}
        title={
          <>
            {job.role},{' '}
            {job.companies.map((company, index) => (
              <Fragment key={company.name}>
                {index > 0 && ' and '}
                <a
                  className="underline decoration-slate-800/30 underline-offset-2 hover:decoration-current print:no-underline"
                  href={company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {company.name}
                </a>
              </Fragment>
            ))}
          </>
        }
      />
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
        {job.description.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1">
        {job.tech.map((item) => (
          <Badge key={item} label={item} />
        ))}
      </div>
    </article>
  )
}

interface EducationEntryProps {
  entry: Degree
}

function EducationEntry({ entry: { degree, period, school, summary } }: EducationEntryProps) {
  return (
    <article className="flex flex-col gap-1 print:break-inside-avoid">
      <EntryHeader title={degree} period={period} />
      <p className="text-sm text-slate-800/60">
        {school.abbreviation === undefined
          ? school.name
          : `${school.name} (${school.abbreviation})`}
        , {school.place}
      </p>
      <p className="text-sm">{summary}</p>
    </article>
  )
}
