import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Send, Phone, Video, Loader2 } from 'lucide-react'
import { useGetMessages, useSendMessage, useMarkRead } from '../hooks/backend/messages'
import { useCall } from '../hooks/useCallManager'
import { useProfile } from '../hooks/useProfileContext'
import { UserAvatar } from './UserAvatar'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import { Skeleton } from '../lib/shadcn/skeleton'
import { timeAgo } from '../utils/timeAgo'
import { cn } from '../lib/shadcn/utils'
import type { ChatMessage } from '../utils/types'

const POLL_MS = 4000

interface ChatThreadProps {
  friend: { id: number; full_name: string; avatar_url: string | null }
}

export function ChatThread({ friend }: ChatThreadProps) {
  const { profile } = useProfile()
  const { data, loading, trigger } = useGetMessages()
  const sendMessage = useSendMessage()
  const markRead = useMarkRead()
  const call = useCall()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = (data ?? []) as ChatMessage[]

  useEffect(() => {
    trigger({ friendId: friend.id })
    markRead.trigger({ friendId: friend.id })
    const interval = setInterval(() => {
      trigger({ friendId: friend.id }, { skipCache: true })
      markRead.trigger({ friendId: friend.id })
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [friend.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    await sendMessage.trigger({ friendId: friend.id, content }).result
    trigger({ friendId: friend.id }, { skipCache: true })
  }

  const canCall = call.phase === 'idle'

  return (
    <div className="flex flex-col h-[70vh] rounded-2xl border border-border/70 bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-density-md p-density-md border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-density-sm">
          <UserAvatar name={friend.full_name} avatarUrl={friend.avatar_url} size="sm" />
          <p className="text-sm font-semibold text-foreground">{friend.full_name}</p>
        </div>
        <div className="flex items-center gap-density-xs">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Start audio call"
            disabled={!canCall}
            onClick={() => call.startCall({ id: friend.id, name: friend.full_name, avatar: friend.avatar_url }, 'audio')}
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Start video call"
            disabled={!canCall}
            onClick={() => call.startCall({ id: friend.id, name: friend.full_name, avatar: friend.avatar_url }, 'video')}
          >
            <Video className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-density-md space-y-density-xs bg-muted/20">
        {loading && !data && (
          <div className="space-y-density-sm">
            <Skeleton className="h-10 w-1/2 rounded-2xl" />
            <Skeleton className="h-10 w-2/5 rounded-2xl ml-auto" />
            <Skeleton className="h-10 w-1/3 rounded-2xl" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-density-lg">Say hello to {friend.full_name}!</p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === profile?.id
          const prev = messages[i - 1]
          const grouped = prev && prev.sender_id === m.sender_id
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start', grouped ? 'mt-1' : 'mt-density-sm')}>
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-density-md py-density-sm text-sm shadow-sm',
                  mine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card text-foreground rounded-bl-md border border-border/60',
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                <p className={cn('text-[10px] mt-1', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {timeAgo(m.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-density-sm p-density-md border-t border-border/60">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="rounded-full bg-muted/40 border-transparent focus-visible:bg-background"
        />
        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!text.trim() || sendMessage.loading} aria-label="Send message">
          {sendMessage.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  )
}
