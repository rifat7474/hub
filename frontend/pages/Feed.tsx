import { useEffect } from 'react'
import { Users } from 'lucide-react'
import { useGetFeed, useToggleLike, useDeletePost } from '../hooks/backend/posts'
import { useProfile } from '../hooks/useProfileContext'
import { CreatePostForm } from '../components/CreatePostForm'
import { PostCard } from '../components/PostCard'
import { Skeleton } from '../lib/shadcn/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../lib/shadcn/empty'
import type { FeedPost } from '../utils/types'
import { toast } from '../lib/shadcn/sonner'

function PostSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-density-lg space-y-density-sm">
      <div className="flex items-center gap-density-sm">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export default function Feed() {
  const { profile } = useProfile()
  const { data, loading, error, trigger } = useGetFeed()
  const toggleLike = useToggleLike()
  const deletePost = useDeletePost()
  const posts = (data ?? []) as FeedPost[]

  useEffect(() => {
    if (profile) trigger()
  }, [trigger, profile])

  function refresh() {
    trigger({}, { skipCache: true })
  }

  async function handleToggleLike(postId: number) {
    try {
      await toggleLike.trigger({ postId }).result
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update like.')
    }
  }

  async function handleDelete(postId: number) {
    try {
      await deletePost.trigger({ postId }).result
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete post.')
    }
  }

  return (
    <div className="space-y-density-lg">
      <CreatePostForm onPosted={refresh} />

      {loading && !data && (
        <div className="space-y-density-lg">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && posts.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Your feed is quiet</EmptyTitle>
            <EmptyDescription>Add friends or share your first post to get things going.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="space-y-density-lg">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentProfileId={profile?.id ?? null}
            onToggleLike={handleToggleLike}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
