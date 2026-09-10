import { type ReactNode, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Users, MessageCircle, UserCircle, ShieldCheck, Circle } from 'lucide-react'
import { useProfile } from '../hooks/useProfileContext'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { useGetConversations } from '../hooks/backend/messages'
import { UserAvatar } from './UserAvatar'
import { ThemeToggle } from './ThemeToggle'
import { Badge } from '../lib/shadcn/badge'
import { cn } from '../lib/shadcn/utils'

const BASE_NAV_ITEMS = [
  { to: '/', label: 'Feed', icon: Home },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserCircle },
]

export function Layout({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const { isAdmin } = useIsAdmin()
  const { data, trigger } = useGetConversations()
  const [unread, setUnread] = useState(0)

  const navItems = isAdmin ? [...BASE_NAV_ITEMS, { to: '/admin', label: 'Admin', icon: ShieldCheck }] : BASE_NAV_ITEMS

  useEffect(() => {
    trigger()
    const interval = setInterval(() => trigger({}, { skipCache: true }), 8000)
    return () => clearInterval(interval)
  }, [trigger])

  useEffect(() => {
    if (Array.isArray(data)) {
      const total = data.reduce((sum: number, c: { unread_count?: string | number }) => sum + Number(c.unread_count ?? 0), 0)
      setUnread(total)
    }
  }, [data])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border/70 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-density-lg py-density-sm gap-density-lg">
          <div className="flex items-center gap-density-xs text-foreground">
            <Circle className="w-5 h-5 fill-primary text-primary" />
            <span className="hidden sm:inline text-sm font-semibold tracking-tight">Circle</span>
          </div>

          <nav className="hidden md:flex items-center gap-density-xs">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2 px-density-md py-density-xs rounded-full text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-foreground text-background shadow-retool-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {to === '/messages' && unread > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 min-w-5 px-1 text-[10px] leading-none flex items-center justify-center rounded-full"
                  >
                    {unread > 9 ? '9+' : unread}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-density-sm">
            <ThemeToggle />
            {profile && <UserAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="sm" ring />}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-density-lg py-density-lg pb-24 md:pb-density-lg">
        {children}
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-density-sm py-density-xs">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-0.5 px-density-md py-density-xs rounded-lg text-[11px] font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <Icon className={cn('w-5 h-5', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                  {to === '/messages' && unread > 0 && (
                    <span className="absolute top-0 right-2 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
