/**
 * Feed: posts from the current user and their accepted friends, newest first,
 * with author info, like/comment counts, and whether the current user liked each post.
 */

interface Params {
  limit?: number
  beforeId?: number
}

export default async function getFeed(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const limit = req.params.limit ?? 20

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) return []

  const friendRows = await retoolDb.query<{ friend_id: number }>(
    `SELECT CASE WHEN requester_id = $1 THEN recipient_id ELSE requester_id END AS friend_id
     FROM friendships WHERE status = 'accepted' AND (requester_id = $2 OR recipient_id = $3)`,
    [myProfileId, myProfileId, myProfileId],
  )
  const authorIds = [myProfileId, ...friendRows.data.map((r) => r.friend_id)]

  // Text order below: SELECT ... $1 (liked_by_me) ... FROM ... WHERE p.author_id = ANY($2) [AND p.id < $3] LIMIT $N
  const params: unknown[] = [myProfileId, authorIds]
  let beforeClause = ''
  if (req.params.beforeId !== undefined) {
    params.push(req.params.beforeId)
    beforeClause = `AND p.id < $${params.length}`
  }
  params.push(limit)
  const limitPlaceholder = `$${params.length}`

  const posts = await retoolDb.query<{
    id: number
    author_id: number
    content: string
    image_url: string | null
    created_at: string
    author_name: string
    author_avatar: string | null
    like_count: number
    comment_count: number
    liked_by_me: boolean
  }>(
    `SELECT p.id, p.author_id, p.content, p.image_url, p.created_at,
            pr.full_name AS author_name, pr.avatar_url AS author_avatar,
            COALESCE(lc.count, 0) AS like_count,
            COALESCE(cc.count, 0) AS comment_count,
            EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.profile_id = $1) AS liked_by_me
     FROM posts p
     JOIN profiles pr ON pr.id = p.author_id
     LEFT JOIN (SELECT post_id, COUNT(*) AS count FROM likes GROUP BY post_id) lc ON lc.post_id = p.id
     LEFT JOIN (SELECT post_id, COUNT(*) AS count FROM comments GROUP BY post_id) cc ON cc.post_id = p.id
     WHERE p.author_id = ANY($2) ${beforeClause}
     ORDER BY p.id DESC
     LIMIT ${limitPlaceholder}`,
    params,
  )

  return posts.data
}
