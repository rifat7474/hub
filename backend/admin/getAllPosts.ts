import { requireAdmin } from './authz'

interface Params {
  limit?: number
}

/** List recent posts across all users with author/like/comment info, for moderation. */
export default async function getAllPosts(req: { params: Params; user: User }) {
  await requireAdmin(req.user)
  const limit = req.params.limit ?? 100

  const result = await retoolDb.query(
    `SELECT p.id, p.content, p.image_url, p.created_at, p.author_id,
            pr.full_name AS author_name, pr.avatar_url AS author_avatar,
            COALESCE(lc.count, 0) AS like_count,
            COALESCE(cc.count, 0) AS comment_count
     FROM posts p
     JOIN profiles pr ON pr.id = p.author_id
     LEFT JOIN (SELECT post_id, COUNT(*) AS count FROM likes GROUP BY post_id) lc ON lc.post_id = p.id
     LEFT JOIN (SELECT post_id, COUNT(*) AS count FROM comments GROUP BY post_id) cc ON cc.post_id = p.id
     ORDER BY p.id DESC
     LIMIT $1`,
    [limit],
  )
  return result.data
}
