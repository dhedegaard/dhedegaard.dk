import { Badge } from './badge'

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
      <span className="text-base-content/40 text-sm">Tech stack</span>
      {STACK.map(({ category, items }) => (
        <div key={category} className="flex items-start gap-3">
          <span className="text-base-content/60 w-20 shrink-0 pt-1 text-xs">{category}</span>
          <div className="flex flex-wrap gap-1">
            {items.map((item) => (
              <Badge key={item} label={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
