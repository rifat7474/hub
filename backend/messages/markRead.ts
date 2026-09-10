/** Mark all messages from a given friend to the current user as read. */

interface Params {
  friendId: number
}

export default async function markRead(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { friendId } = req.params

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const result = await retoolDb.query(
    `UPDATE messages SET read_at = now()
     WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL RETURNING id`,
    [friendId, myProfileId],
  )
  return { markedCount: result.data.length }
}
