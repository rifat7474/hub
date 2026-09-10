/** Send a 1:1 text message to a friend. Requires an accepted friendship. */

interface Params {
  friendId: number
  content: string
}

export default async function sendMessage(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { friendId, content } = req.params
  if (!content?.trim()) throw new Error('Message cannot be empty.')

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const friendship = await retoolDb.query<{ id: number }>(
    `SELECT id FROM friendships
     WHERE status = 'accepted' AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $3 AND recipient_id = $4))`,
    [myProfileId, friendId, friendId, myProfileId],
  )
  if (friendship.data.length === 0) throw new Error('You can only message friends.')

  const inserted = await retoolDb.query(
    `INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [myProfileId, friendId, content.trim()],
  )
  return inserted.data[0]
}
