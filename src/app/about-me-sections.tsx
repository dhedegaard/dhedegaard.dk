import { Fragment } from 'react'
import { Badge } from './badge'
import { ABOUT, EDUCATION, EXPERIENCE, OUTSIDE_WORK, SPOKEN_LANGUAGES } from './about-me-data'
import { SectionHeading } from './section-heading'

type Job = (typeof EXPERIENCE)[number]
type EducationEntry = (typeof EDUCATION)[number]

const periodClass = 'shrink-0 text-sm text-slate-800/60 tabular-nums'
const companyLinkClass =
  'underline decoration-slate-800/30 underline-offset-2 hover:decoration-current'

export function About() {
  return (
    <section className="mb-12">
      <SectionHeading>About</SectionHeading>
      <div className="flex flex-col gap-3">
        {ABOUT.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}

export function Experience() {
  return (
    <section className="mb-12">
      <SectionHeading>Experience</SectionHeading>
      <div className="flex flex-col gap-6">
        {EXPERIENCE.map((job) => (
          <JobEntry key={job.period} job={job} />
        ))}
      </div>
    </section>
  )
}

interface JobEntryProps {
  job: Job
}

function JobEntry({ job }: JobEntryProps) {
  return (
    <article className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-semibold">
          {job.role},{' '}
          {job.companies.map((company, index) => (
            <Fragment key={company.name}>
              {index > 0 && ' and '}
              <a
                className={companyLinkClass}
                href={company.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {company.name}
              </a>
            </Fragment>
          ))}
        </h3>
        <span className={periodClass}>{job.period}</span>
      </div>
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

export function Education() {
  return (
    <section className="mb-12">
      <SectionHeading>Education</SectionHeading>
      <div className="flex flex-col gap-4">
        {EDUCATION.map((entry) => (
          <EducationItem key={entry.period} entry={entry} />
        ))}
      </div>
      <h3 className="mt-6 mb-1 font-semibold">Spoken languages</h3>
      <p className="text-sm">{SPOKEN_LANGUAGES}</p>
      <h3 className="mt-4 mb-1 font-semibold">Outside work</h3>
      <p className="text-sm">{OUTSIDE_WORK}</p>
    </section>
  )
}

interface EducationItemProps {
  entry: EducationEntry
}

function EducationItem({ entry }: EducationItemProps) {
  return (
    <article className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-semibold">{entry.degree}</h3>
        <span className={periodClass}>{entry.period}</span>
      </div>
      <p className="text-sm text-slate-800/60">
        {entry.school}, {entry.place}
      </p>
      <p className="text-sm">{entry.summary}</p>
    </article>
  )
}
