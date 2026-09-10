import { Avatar, AvatarFallback, AvatarImage } from '../lib/shadcn/avatar'
import { cn } from '../lib/shadcn/utils'

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Deterministic pastel accent per person, cycling through the chart palette so it
// adapts to light/dark mode while still giving each avatar a distinct identity.
const ACCENTS = [1, 2, 3, 4, 5]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const SIZE_CLASSES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
} as const

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
  ring?: boolean
}

export function UserAvatar({ name, avatarUrl, size = 'md', className, ring }: UserAvatarProps) {
  const accent = ACCENTS[hashName(name) % ACCENTS.length]
  return (
    <Avatar
      className={cn(
        SIZE_CLASSES[size],
        ring && 'ring-2 ring-background shadow-retool-sm',
        className,
      )}
    >
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
      <AvatarFallback
        className="font-semibold"
        style={{
          backgroundColor: `hsl(var(--chart-${accent}) / 0.16)`,
          color: `hsl(var(--chart-${accent}))`,
        }}
      >
        {initials(name) || '?'}
      </AvatarFallback>
    </Avatar>
  )
}
