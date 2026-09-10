import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { cn } from '../lib/shadcn/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
        className,
      )}
    >
      <Sun className={cn('absolute w-4.5 h-4.5 transition-all duration-300', isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
      <Moon className={cn('absolute w-4.5 h-4.5 transition-all duration-300', isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0')} />
    </button>
  )
}
