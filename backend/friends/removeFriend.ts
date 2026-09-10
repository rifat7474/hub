/** Remove an existing friendship (either direction) between the current user and another profile. */

interface Params {
  friendId: number
}

export default async function removeFriend(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { friendId } = req.params

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const result = await retoolDb.query(
    `DELETE FROM friendships
     WHERE (requester_id = $1 AND recipient_id = $2) OR (requester_id = $3 AND recipient_id = $4)
     RETURNING id`,
    [myProfileId, friendId, friendId, myProfileId],
  )
  return { removed: result.data.length > 0 }
}
