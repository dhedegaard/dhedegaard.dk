interface TaglineProps {
  company: string | null
}

export function Tagline({ company }: TaglineProps) {
  return (
    <p className="text-base-content/60 text-lg">
      Full-stack software engineer{company != null ? ` ${company}` : ''}
    </p>
  )
}
