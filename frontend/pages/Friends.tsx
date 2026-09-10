import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Search, UserPlus, Check, X, UserMinus, Loader2, Users as UsersIcon } from 'lucide-react'
import { useSearchProfiles } from '../hooks/backend/profiles'
import {
  useGetFriends,
  useGetFriendRequests,
  useSendFriendRequest,
  useRespondFriendRequest,
  useRemoveFriend,
} from '../hooks/backend/friends'
import { Input } from '../lib/shadcn/input'
import { Button } from '../lib/shadcn/button'
import { UserAvatar } from '../components/UserAvatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../lib/shadcn/tabs'
import { Badge } from '../lib/shadcn/badge'
import { Skeleton } from '../lib/shadcn/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../lib/shadcn/empty'
import { toast } from '../lib/shadcn/sonner'
import type { FriendProfile, FriendRequestRow, SearchResultProfile } from '../utils/types'

function PersonRow({
  name,
  email,
  avatar,
  right,
}: {
  name: string
  email?: string
  avatar: string | null
  right: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-density-md p-density-md rounded-xl border border-border/70 bg-card hover:shadow-retool-sm transition-shadow">
      <div className="flex items-center gap-density-sm min-w-0">
        <UserAvatar name={name} avatarUrl={avatar} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
        </div>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-density-sm p-density-md rounded-xl border border-border/70 bg-card">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-40" />
      </div>
    </div>
  )
}

export default function Friends() {
  const [query, setQuery] = useState('')
  const search = useSearchProfiles()
  const friendsFn = useGetFriends()
  const requestsFn = useGetFriendRequests()
  const sendRequest = useSendFriendRequest()
  const respondRequest = useRespondFriendRequest()
  const removeFriend = useRemoveFriend()

  const friends = (friendsFn.data ?? []) as FriendProfile[]
  const requests = requestsFn.data ?? { incoming: [], outgoing: [] }
  const incoming = requests.incoming as FriendRequestRow[]
  const outgoing = requests.outgoing as FriendRequestRow[]
  const results = (search.data ?? []) as SearchResultProfile[]

  useEffect(() => {
    friendsFn.trigger()
    requestsFn.trigger()
  }, [])

  function refreshAll() {
    friendsFn.trigger({}, { skipCache: true })
    requestsFn.trigger({}, { skipCache: true })
    if (query.trim()) search.trigger({ query: query.trim() }, { skipCache: true })
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    await search.trigger({ query: query.trim() }).result
  }

  async function handleSendRequest(recipientId: number) {
    try {
      await sendRequest.trigger({ recipientId }).result
      refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send friend request.')
    }
  }

  async function handleRespond(friendshipId: number, accept: boolean) {
    try {
      await respondRequest.trigger({ friendshipId, accept }).result
      refreshAll()
      toast.success(accept ? 'Friend request accepted.' : 'Friend request declined.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to respond to request.')
    }
  }

  async function handleRemove(friendId: number) {
    try {
      await removeFriend.trigger({ friendId }).result
      refreshAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove friend.')
    }
  }

  return (
    <div className="space-y-density-xl">
      <form onSubmit={handleSearch} className="flex items-center gap-density-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people by name or email..."
            className="pl-10 h-11 rounded-full bg-muted/40 border-transparent focus-visible:bg-background"
          />
        </div>
        <Button type="submit" className="rounded-full h-11 px-density-lg" disabled={!query.trim() || search.loading}>
          {search.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      {search.data !== null && (
        <div className="space-y-density-sm animate-in fade-in duration-200">
          <p className="text-sm font-medium text-muted-foreground px-density-xs">Search results</p>
          {results.length === 0 && <p className="text-sm text-muted-foreground px-density-xs">No matching profiles found.</p>}
          {results.map((r) => (
            <PersonRow
              key={r.id}
              name={r.full_name}
              email={r.email}
              avatar={r.avatar_url}
              right={
                r.friendshipStatus === 'friends' ? (
                  <Badge variant="secondary">Friends</Badge>
                ) : r.friendshipStatus === 'pending_sent' ? (
                  <Badge variant="outline">Request sent</Badge>
                ) : r.friendshipStatus === 'pending_received' ? (
                  <Badge variant="outline">Respond in Requests</Badge>
                ) : (
                  <Button size="sm" className="rounded-full" onClick={() => handleSendRequest(r.id)} disabled={sendRequest.loading}>
                    <UserPlus className="w-4 h-4" /> Add
                  </Button>
                )
              }
            />
          ))}
        </div>
      )}

      <Tabs defaultValue="friends">
        <TabsList className="rounded-full">
          <TabsTrigger value="friends" className="rounded-full">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-full">
            Requests
            {incoming.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 px-1 rounded-full">
                {incoming.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-density-sm">
          {friendsFn.loading && !friendsFn.data && (
            <div className="space-y-density-sm">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          )}
          {!friendsFn.loading && friends.length === 0 && (
            <Empty className="min-h-[240px]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No friends yet</EmptyTitle>
                <EmptyDescription>Search above to find and connect with people in your org.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {friends.map((f) => (
            <PersonRow
              key={f.id}
              name={f.full_name}
              email={f.email}
              avatar={f.avatar_url}
              right={
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(f.id)}
                >
                  <UserMinus className="w-4 h-4" /> Remove
                </Button>
              }
            />
          ))}
        </TabsContent>

        <TabsContent value="requests" className="space-y-density-lg">
          <div className="space-y-density-sm">
            <p className="text-sm font-medium text-muted-foreground px-density-xs">Incoming</p>
            {incoming.length === 0 && <p className="text-sm text-muted-foreground px-density-xs">No incoming requests.</p>}
            {incoming.map((r) => (
              <PersonRow
                key={r.friendship_id}
                name={r.full_name}
                email={r.email}
                avatar={r.avatar_url}
                right={
                  <div className="flex items-center gap-density-xs">
                    <Button size="icon" className="h-8 w-8 rounded-full" aria-label="Accept" onClick={() => handleRespond(r.friendship_id, true)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      aria-label="Decline"
                      onClick={() => handleRespond(r.friendship_id, false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>

          <div className="space-y-density-sm">
            <p className="text-sm font-medium text-muted-foreground px-density-xs">Outgoing</p>
            {outgoing.length === 0 && <p className="text-sm text-muted-foreground px-density-xs">No outgoing requests.</p>}
            {outgoing.map((r) => (
              <PersonRow key={r.friendship_id} name={r.full_name} email={r.email} avatar={r.avatar_url} right={<Badge variant="outline">Pending</Badge>} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
