import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useGetConversations } from '../hooks/backend/messages'
import { useGetFriends } from '../hooks/backend/friends'
import { UserAvatar } from '../components/UserAvatar'
import { Badge } from '../lib/shadcn/badge'
import { Skeleton } from '../lib/shadcn/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../lib/shadcn/empty'
import { ChatThread } from '../components/ChatThread'
import { timeAgo } from '../utils/timeAgo'
import { cn } from '../lib/shadcn/utils'
import type { Conversation, FriendProfile } from '../utils/types'

export default function Messages() {
  const { friendId } = useParams<{ friendId: string }>()
  const navigate = useNavigate()
  const conversationsFn = useGetConversations()
  const friendsFn = useGetFriends()

  const conversations = (conversationsFn.data ?? []) as Conversation[]
  const friends = (friendsFn.data ?? []) as FriendProfile[]
  const selectedId = friendId ? Number(friendId) : null

  useEffect(() => {
    conversationsFn.trigger()
    friendsFn.trigger()
  }, [])

  const friendsWithoutConvo = friends.filter((f) => !conversations.some((c) => c.friend_id === f.id))
  const rows: Array<{ id: number; name: string; avatar: string | null; preview: string | null; at: string | null; unread: number }> = [
    ...conversations.map((c) => ({
      id: c.friend_id,
      name: c.full_name,
      avatar: c.avatar_url,
      preview: c.last_message,
      at: c.last_message_at,
      unread: Number(c.unread_count ?? 0),
    })),
    ...friendsWithoutConvo.map((f) => ({ id: f.id, name: f.full_name, avatar: f.avatar_url, preview: null, at: null, unread: 0 })),
  ]

  const selectedFriend =
    friends.find((f) => f.id === selectedId) ??
    (conversations.find((c) => c.friend_id === selectedId)
      ? {
          id: selectedId!,
          full_name: conversations.find((c) => c.friend_id === selectedId)!.full_name,
          avatar_url: conversations.find((c) => c.friend_id === selectedId)!.avatar_url,
        }
      : null)

  const loading = (conversationsFn.loading && !conversationsFn.data) || (friendsFn.loading && !friendsFn.data)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-density-lg">
      <div className={cn('space-y-density-xs', selectedFriend && 'hidden md:block')}>
        <p className="text-sm font-medium text-muted-foreground px-density-xs">Conversations</p>

        {loading && (
          <div className="space-y-density-xs">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-density-sm p-density-sm">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <Empty className="min-h-[200px] p-density-lg">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircle />
              </EmptyMedia>
              <EmptyTitle>No conversations</EmptyTitle>
              <EmptyDescription>Add friends to start messaging.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {rows.map((r) => (
          <button
            key={r.id}
            onClick={() => navigate(`/messages/${r.id}`)}
            className={cn(
              'w-full flex items-center gap-density-sm p-density-sm rounded-xl text-left transition-colors',
              selectedId === r.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
            )}
          >
            <UserAvatar name={r.name} avatarUrl={r.avatar} size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground truncate">{r.preview ?? 'No messages yet'}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {r.at && <span className="text-[10px] text-muted-foreground">{timeAgo(r.at)}</span>}
              {r.unread > 0 && <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px] rounded-full">{r.unread}</Badge>}
            </div>
          </button>
        ))}
      </div>

      <div className={cn('md:col-span-2', !selectedFriend && 'hidden md:block')}>
        {selectedFriend ? (
          <ChatThread friend={selectedFriend} />
        ) : (
          <div className="h-[70vh] flex items-center justify-center rounded-2xl border border-dashed border-border/70 text-muted-foreground text-sm">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  )
}
