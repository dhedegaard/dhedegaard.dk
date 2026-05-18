interface TaglineProps {
  company: string | null
}

export function Tagline({ company }: TaglineProps) {
  const companyNode =
    company == null ? null : company.startsWith('@') ? (
      <a
        href={`https://github.com/${company.slice(1)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {company}
      </a>
    ) : (
      company
    )

  return (
    <p className="text-base-content/60 text-lg">
      Full-stack software engineer{companyNode != null ? <> {companyNode}</> : ''}
    </p>
  )
}
