/** Fetch the message thread between the current user and a friend, oldest first. */

interface Params {
  friendId: number
  limit?: number
}

export default async function getMessages(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { friendId } = req.params
  const limit = req.params.limit ?? 100

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) return []

  const result = await retoolDb.query(
    `SELECT id, sender_id, recipient_id, content, created_at, read_at FROM messages
     WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $3 AND recipient_id = $4)
     ORDER BY id DESC LIMIT $5`,
    [myProfileId, friendId, friendId, myProfileId, limit],
  )
  return result.data.reverse()
}
