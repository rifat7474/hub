/** Send a friend request from the current user to another profile. */

interface Params {
  recipientId: number
}

export default async function sendFriendRequest(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { recipientId } = req.params

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')
  if (myProfileId === recipientId) throw new Error('Cannot friend yourself.')

  const existing = await retoolDb.query<{ id: number; status: string }>(
    `SELECT id, status FROM friendships
     WHERE (requester_id = $1 AND recipient_id = $2) OR (requester_id = $3 AND recipient_id = $4)`,
    [myProfileId, recipientId, recipientId, myProfileId],
  )
  if (existing.data.length > 0) {
    return existing.data[0]
  }

  const inserted = await retoolDb.query(
    `INSERT INTO friendships (requester_id, recipient_id, status) VALUES ($1, $2, 'pending') RETURNING *`,
    [myProfileId, recipientId],
  )
  return inserted.data[0]
}
