/** List the current user's accepted friends. */

export default async function getFriends(req: { params: {}; user: User }) {
  const userId = String(req.user.id)
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) return []

  const result = await retoolDb.query(
    `SELECT pr.id, pr.full_name, pr.email, pr.avatar_url, pr.bio
     FROM friendships f
     JOIN profiles pr ON pr.id = CASE WHEN f.requester_id = $1 THEN f.recipient_id ELSE f.requester_id END
     WHERE f.status = 'accepted' AND (f.requester_id = $2 OR f.recipient_id = $3)
     ORDER BY pr.full_name ASC`,
    [myProfileId, myProfileId, myProfileId],
  )
  return result.data
}
