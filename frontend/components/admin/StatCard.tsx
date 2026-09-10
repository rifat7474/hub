import type { ReactNode } from 'react'
import { cn } from '../../lib/shadcn/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  accent?: 1 | 2 | 3 | 4 | 5
}

export function StatCard({ label, value, icon, accent = 1 }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-density-lg shadow-retool-sm flex items-center gap-density-md">
      <div
        className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&_svg]:h-5 [&_svg]:w-5')}
        style={{ backgroundColor: `hsl(var(--chart-${accent}) / 0.14)`, color: `hsl(var(--chart-${accent}))` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground tabular-nums leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
