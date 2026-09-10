import { requireAdmin } from './authz'

/** Aggregate stats for the admin dashboard: totals plus 14-day daily trends. */
export default async function getStats(req: { params: {}; user: User }) {
  await requireAdmin(req.user)

  const totals = await retoolDb.query<{
    total_users: string
    total_posts: string
    total_comments: string
    total_likes: string
    total_friendships: string
    total_messages: string
    total_calls: string
  }>(
    `SELECT
       (SELECT COUNT(*) FROM profiles) AS total_users,
       (SELECT COUNT(*) FROM posts) AS total_posts,
       (SELECT COUNT(*) FROM comments) AS total_comments,
       (SELECT COUNT(*) FROM likes) AS total_likes,
       (SELECT COUNT(*) FROM friendships WHERE status = 'accepted') AS total_friendships,
       (SELECT COUNT(*) FROM messages) AS total_messages,
       (SELECT COUNT(*) FROM calls) AS total_calls`,
  )

  const pending = await retoolDb.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM friendships WHERE status = 'pending'`,
  )

  const usersByDay = await retoolDb.query<{ day: string; count: string }>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*) AS count
     FROM profiles
     WHERE created_at > now() - interval '14 days'
     GROUP BY 1 ORDER BY 1`,
  )

  const postsByDay = await retoolDb.query<{ day: string; count: string }>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*) AS count
     FROM posts
     WHERE created_at > now() - interval '14 days'
     GROUP BY 1 ORDER BY 1`,
  )

  const messagesByDay = await retoolDb.query<{ day: string; count: string }>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*) AS count
     FROM messages
     WHERE created_at > now() - interval '14 days'
     GROUP BY 1 ORDER BY 1`,
  )

  return {
    totals: totals.data[0],
    pendingFriendRequests: Number(pending.data[0]?.count ?? 0),
    usersByDay: usersByDay.data,
    postsByDay: postsByDay.data,
    messagesByDay: messagesByDay.data,
  }
}
