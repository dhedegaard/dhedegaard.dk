import { Badge } from './badge'

const STACK = [
  { category: 'Frontend', items: ['React', 'Next.js', 'Tailwind'] },
  { category: 'Backend', items: ['Node.js', 'PostgreSQL', 'Prisma'] },
  { category: 'Quality', items: ['TypeScript', 'Zod', 'Vitest', 'Playwright', 'Sentry'] },
  { category: 'Infra', items: ['Docker', 'GitHub Actions', 'AWS', 'Azure', 'Vercel'] },
  { category: 'AI', items: ['Claude Code', 'Codex'] },
] as const

export function TechStack() {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-slate-800/40">Tech stack</span>
      {STACK.map(({ category, items }) => (
        <div key={category} className="flex items-start gap-3">
          <span className="w-20 shrink-0 pt-1 text-xs text-slate-800/60">{category}</span>
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
