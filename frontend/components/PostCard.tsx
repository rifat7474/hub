import { useState } from 'react'
import { Heart, MessageSquare, Trash2 } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { Button } from '../lib/shadcn/button'
import { timeAgo } from '../utils/timeAgo'
import type { FeedPost } from '../utils/types'
import { CommentsSection } from './CommentsSection'
import { cn } from '../lib/shadcn/utils'

interface PostCardProps {
  post: FeedPost
  currentProfileId: number | null
  onToggleLike: (postId: number) => void
  onDelete: (postId: number) => void
}

export function PostCard({ post, currentProfileId, onToggleLike, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const isOwner = currentProfileId === post.author_id

  return (
    <div className="group rounded-2xl border border-border/70 bg-card text-card-foreground shadow-retool-sm hover:shadow-retool-md transition-shadow duration-200 p-density-lg">
      <div className="flex items-start justify-between gap-density-md">
        <div className="flex items-center gap-density-sm">
          <UserAvatar name={post.author_name} avatarUrl={post.author_avatar} />
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{post.author_name}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
            aria-label="Delete post"
            onClick={() => onDelete(post.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {post.content && (
        <p className="mt-density-md text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>
      )}

      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post attachment"
          className="mt-density-md rounded-xl max-h-96 w-full object-cover border border-border/60"
        />
      )}

      <div className="mt-density-md flex items-center gap-density-lg border-t border-border/60 pt-density-sm">
        <button
          onClick={() => onToggleLike(post.id)}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-all active:scale-90',
            post.liked_by_me ? 'text-destructive' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Heart className={cn('w-4 h-4 transition-transform', post.liked_by_me && 'fill-current scale-110')} />
          {Number(post.like_count)}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            showComments ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <MessageSquare className="w-4 h-4" />
          {Number(post.comment_count)}
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}
    </div>
  )
}
