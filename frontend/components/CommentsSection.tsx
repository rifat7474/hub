import { useEffect, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { Input } from '../lib/shadcn/input'
import { Button } from '../lib/shadcn/button'
import { Skeleton } from '../lib/shadcn/skeleton'
import { timeAgo } from '../utils/timeAgo'
import { useGetComments, useAddComment } from '../hooks/backend/posts'
import type { PostComment } from '../utils/types'

export function CommentsSection({ postId }: { postId: number }) {
  const { data, loading, trigger } = useGetComments()
  const addComment = useAddComment()
  const [text, setText] = useState('')
  const comments = (data ?? []) as PostComment[]

  useEffect(() => {
    trigger({ postId })
  }, [trigger, postId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    await addComment.trigger({ postId, content }).result
    trigger({ postId }, { skipCache: true })
  }

  return (
    <div className="mt-density-md border-t border-border/60 pt-density-md space-y-density-sm animate-in fade-in slide-in-from-top-1 duration-200">
      {loading && !data && (
        <div className="space-y-density-sm">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-8 w-1/2 rounded-lg" />
        </div>
      )}

      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-density-sm">
          <UserAvatar name={c.author_name} avatarUrl={c.author_avatar} size="xs" />
          <div className="flex-1 rounded-2xl bg-muted px-density-md py-density-xs">
            <p className="text-xs font-semibold text-foreground">{c.author_name}</p>
            <p className="text-sm text-foreground">{c.content}</p>
          </div>
          <p className="text-xs text-muted-foreground shrink-0 mt-1.5">{timeAgo(c.created_at)}</p>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex items-center gap-density-sm">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="h-9 rounded-full bg-muted/60 border-transparent focus-visible:bg-background"
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          disabled={!text.trim() || addComment.loading}
          aria-label="Send comment"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
