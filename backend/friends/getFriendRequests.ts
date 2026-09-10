/** List incoming pending friend requests for the current user. */

export default async function getFriendRequests(req: { params: {}; user: User }) {
  const userId = String(req.user.id)
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) return { incoming: [], outgoing: [] }

  const incoming = await retoolDb.query(
    `SELECT f.id AS friendship_id, pr.id, pr.full_name, pr.email, pr.avatar_url, f.created_at
     FROM friendships f JOIN profiles pr ON pr.id = f.requester_id
     WHERE f.recipient_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [myProfileId],
  )
  const outgoing = await retoolDb.query(
    `SELECT f.id AS friendship_id, pr.id, pr.full_name, pr.email, pr.avatar_url, f.created_at
     FROM friendships f JOIN profiles pr ON pr.id = f.recipient_id
     WHERE f.requester_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [myProfileId],
  )
  return { incoming: incoming.data, outgoing: outgoing.data }
}
