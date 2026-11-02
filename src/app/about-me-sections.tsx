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
      <SectionHeading>About</SectionHeading>
      <div className="flex flex-col gap-3">
        {ABOUT.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}

export function Experience({ className }: SectionProps) {
  return (
    <section className={`mb-12 ${className ?? ''}`}>
      <SectionHeading>Experience</SectionHeading>
      <div className="flex flex-col gap-6">
        {EXPERIENCE.map((job) => (
          <JobEntry key={job.period} job={job} />
        ))}
      </div>
    </section>
  )
}

export function Education({ className }: SectionProps) {
  return (
    <section className={`mb-12 ${className ?? ''}`}>
      <SectionHeading>Education</SectionHeading>
      <div className="flex flex-col gap-4">
        {EDUCATION.map((entry) => (
          <EducationEntry key={entry.period} entry={entry} />
        ))}
      </div>
      <h3 className="mt-6 mb-1 font-semibold">Spoken languages</h3>
      <p className="text-sm">{SPOKEN_LANGUAGES}</p>
    </section>
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
    <article className="flex flex-col gap-2">
      <EntryHeader
        period={job.period}
        title={
          <>
            {job.role},{' '}
            {job.companies.map((company, index) => (
              <Fragment key={company.name}>
                {index > 0 && ' and '}
                <a
                  className="underline decoration-slate-800/30 underline-offset-2 hover:decoration-current"
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
    <article className="flex flex-col gap-1">
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
