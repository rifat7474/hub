import { requireAdmin } from './authz'

/** List all profiles with post/friend counts, for the admin dashboard's user table. */
export default async function getAllProfiles(req: { params: {}; user: User }) {
  await requireAdmin(req.user)

  const result = await retoolDb.query(
    `SELECT
       p.id, p.full_name, p.email, p.avatar_url, p.bio, p.created_at, p.is_admin,
       COALESCE(pc.count, 0) AS post_count,
       COALESCE(fc.count, 0) AS friend_count
     FROM profiles p
     LEFT JOIN (SELECT author_id, COUNT(*) AS count FROM posts GROUP BY author_id) pc ON pc.author_id = p.id
     LEFT JOIN (
       SELECT profile_id, COUNT(*) AS count FROM (
         SELECT requester_id AS profile_id FROM friendships WHERE status = 'accepted'
         UNION ALL
         SELECT recipient_id AS profile_id FROM friendships WHERE status = 'accepted'
       ) f GROUP BY profile_id
     ) fc ON fc.profile_id = p.id
     ORDER BY p.created_at DESC`,
  )
  return result.data
}
