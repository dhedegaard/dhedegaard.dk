const STACK = [
  { category: 'Frontend', items: ['TypeScript', 'React', 'Next.js', 'Tailwind'] },
  { category: 'Backend', items: ['Node.js', 'PostgreSQL', 'Prisma', 'Zod'] },
  { category: 'Testing', items: ['Vitest', 'Playwright'] },
  { category: 'Observability', items: ['Sentry'] },
  { category: 'Infra', items: ['Docker', 'GitHub Actions', 'AWS', 'Azure', 'Vercel'] },
] as const

export function TechStack() {
  return (
    <div className="flex flex-col gap-2">
      {STACK.map(({ category, items }) => (
        <div key={category} className="flex items-start gap-3">
          <span className="w-20 shrink-0 pt-1 text-xs text-base-content/60">{category}</span>
          <div className="flex flex-wrap gap-1">
            {items.map((item) => (
              <span
                key={item}
                className="select-none rounded bg-base-content/10 px-1.5 py-0.5 text-xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
