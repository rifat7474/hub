/** Accept or decline an incoming friend request addressed to the current user. */

interface Params {
  friendshipId: number
  accept: boolean
}

export default async function respondFriendRequest(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { friendshipId, accept } = req.params

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const result = await retoolDb.query(
    `UPDATE friendships SET status = $1, updated_at = now()
     WHERE id = $2 AND recipient_id = $3 AND status = 'pending' RETURNING *`,
    [accept ? 'accepted' : 'declined', friendshipId, myProfileId],
  )
  if (result.data.length === 0) {
    throw new Error('Friend request not found or already resolved.')
  }
  return result.data[0]
}
