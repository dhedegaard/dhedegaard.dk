interface BadgeProps {
  label: string
}

export function Badge({ label }: BadgeProps) {
  return (
    <span className="bg-slate-800/10 select-none rounded px-1.5 py-0.5 text-xs">{label}</span>
  )
}
