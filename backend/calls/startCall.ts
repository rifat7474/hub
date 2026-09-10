/**
 * Start a call: creates a "ringing" call row carrying the WebRTC offer SDP for the callee
 * to pick up via polling. Requires an accepted friendship.
 */

interface Params {
  calleeId: number
  callType: 'audio' | 'video'
  offer: string
}

export default async function startCall(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { calleeId, callType, offer } = req.params

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const friendship = await retoolDb.query<{ id: number }>(
    `SELECT id FROM friendships
     WHERE status = 'accepted' AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $3 AND recipient_id = $4))`,
    [myProfileId, calleeId, calleeId, myProfileId],
  )
  if (friendship.data.length === 0) throw new Error('You can only call friends.')

  // Avoid creating a duplicate ringing call to the same friend.
  const active = await retoolDb.query<{ id: number }>(
    `SELECT id FROM calls WHERE caller_id = $1 AND callee_id = $2 AND status = 'ringing'`,
    [myProfileId, calleeId],
  )
  if (active.data.length > 0) {
    return { id: active.data[0]!.id, alreadyRinging: true }
  }

  const inserted = await retoolDb.query(
    `INSERT INTO calls (caller_id, callee_id, call_type, status, offer)
     VALUES ($1, $2, $3, 'ringing', $4) RETURNING *`,
    [myProfileId, calleeId, callType, offer],
  )
  return inserted.data[0]
}
