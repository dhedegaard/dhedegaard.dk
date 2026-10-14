interface BadgeProps {
  label: string
}

export function Badge({ label }: BadgeProps) {
  return <span className="rounded bg-slate-800/10 px-1.5 py-0.5 text-xs">{label}</span>
}
