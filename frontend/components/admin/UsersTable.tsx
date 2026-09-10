import { useMemo, useState } from 'react'
import { Search, ShieldCheck, Shield } from 'lucide-react'
import { Input } from '../../lib/shadcn/input'
import { Button } from '../../lib/shadcn/button'
import { Badge } from '../../lib/shadcn/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../lib/shadcn/table'
import { UserAvatar } from '../UserAvatar'
import { timeAgo } from '../../utils/timeAgo'

interface AdminProfile {
  id: number
  full_name: string
  email: string
  avatar_url: string | null
  bio: string
  created_at: string
  is_admin: boolean
  post_count: string | number
  friend_count: string | number
}

interface UsersTableProps {
  profiles: AdminProfile[]
  onToggleAdmin: (profileId: number, nextIsAdmin: boolean) => void
  togglingId: number | null
}

export function UsersTable({ profiles, onToggleAdmin, togglingId }: UsersTableProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return profiles
    return profiles.filter((p) => p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
  }, [profiles, query])

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-retool-sm overflow-hidden">
      <div className="p-density-md border-b border-border/60">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter users..."
            className="pl-9 h-9 rounded-full bg-muted/40 border-transparent focus-visible:bg-background"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Posts</TableHead>
            <TableHead className="text-right">Friends</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-density-sm">
                  <UserAvatar name={p.full_name} avatarUrl={p.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{timeAgo(p.created_at)}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{Number(p.post_count)}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{Number(p.friend_count)}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={p.is_admin ? 'secondary' : 'outline'}
                  className="rounded-full"
                  disabled={togglingId === p.id}
                  onClick={() => onToggleAdmin(p.id, !p.is_admin)}
                >
                  {p.is_admin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {p.is_admin ? <Badge variant="secondary" className="ml-1">Admin</Badge> : 'Make admin'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-density-lg">
                No users match your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
