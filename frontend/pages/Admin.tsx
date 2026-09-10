import { useEffect } from 'react'
import { Users, FileText, MessageCircle, Heart, UserCheck, PhoneCall, ShieldAlert } from 'lucide-react'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { useGetStats, useGetAllProfiles, useGetAllPosts, useDeletePostAdmin, useSetAdminStatus } from '../hooks/backend/admin'
import { StatCard } from '../components/admin/StatCard'
import { ActivityChart } from '../components/admin/ActivityChart'
import { UsersTable } from '../components/admin/UsersTable'
import { PostsTable } from '../components/admin/PostsTable'
import { Skeleton } from '../lib/shadcn/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../lib/shadcn/empty'
import { toast } from '../lib/shadcn/sonner'

export default function Admin() {
  const { isAdmin, loading: adminCheckLoading } = useIsAdmin()
  const statsFn = useGetStats()
  const profilesFn = useGetAllProfiles()
  const postsFn = useGetAllPosts()
  const deletePostAdmin = useDeletePostAdmin()
  const setAdminStatus = useSetAdminStatus()

  useEffect(() => {
    if (!isAdmin) return
    statsFn.trigger()
    profilesFn.trigger()
    postsFn.trigger()
  }, [isAdmin])

  if (adminCheckLoading) {
    return (
      <div className="space-y-density-lg">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-density-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <Empty className="min-h-[320px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert />
          </EmptyMedia>
          <EmptyTitle>Admin access required</EmptyTitle>
          <EmptyDescription>Ask an existing admin to grant you access from their Admin dashboard.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const stats = statsFn.data
  const profiles = profilesFn.data ?? []
  const posts = postsFn.data ?? []

  async function handleDeletePost(postId: number) {
    try {
      await deletePostAdmin.trigger({ postId }).result
      toast.success('Post deleted.')
      postsFn.trigger({}, { skipCache: true })
      statsFn.trigger({}, { skipCache: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete post.')
    }
  }

  async function handleToggleAdmin(profileId: number, nextIsAdmin: boolean) {
    try {
      await setAdminStatus.trigger({ profileId, isAdmin: nextIsAdmin }).result
      toast.success(nextIsAdmin ? 'Granted admin access.' : 'Revoked admin access.')
      profilesFn.trigger({}, { skipCache: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update admin access.')
    }
  }

  return (
    <div className="space-y-density-xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">Org-wide activity and content moderation.</p>
      </div>

      {!stats && statsFn.loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-density-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-density-md">
          <StatCard label="Users" value={Number(stats.totals.total_users)} icon={<Users />} accent={1} />
          <StatCard label="Posts" value={Number(stats.totals.total_posts)} icon={<FileText />} accent={2} />
          <StatCard label="Messages" value={Number(stats.totals.total_messages)} icon={<MessageCircle />} accent={3} />
          <StatCard label="Likes" value={Number(stats.totals.total_likes)} icon={<Heart />} accent={4} />
          <StatCard label="Friendships" value={Number(stats.totals.total_friendships)} icon={<UserCheck />} accent={5} />
          <StatCard label="Calls placed" value={Number(stats.totals.total_calls)} icon={<PhoneCall />} accent={1} />
        </div>
      ) : null}

      {stats && <ActivityChart usersByDay={stats.usersByDay} postsByDay={stats.postsByDay} messagesByDay={stats.messagesByDay} />}

      <div className="space-y-density-md">
        <h2 className="text-sm font-semibold text-foreground px-density-xs">Users</h2>
        {profilesFn.loading && !profilesFn.data ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <UsersTable profiles={profiles} onToggleAdmin={handleToggleAdmin} togglingId={setAdminStatus.loading ? -1 : null} />
        )}
      </div>

      <div className="space-y-density-md">
        <h2 className="text-sm font-semibold text-foreground px-density-xs">Recent posts</h2>
        {postsFn.loading && !postsFn.data ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <PostsTable posts={posts} onDelete={handleDeletePost} deleting={deletePostAdmin.loading} />
        )}
      </div>
    </div>
  )
}
