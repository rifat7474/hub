/** Submit a WebRTC ICE candidate for an active call, relayed to the other participant via polling. */

interface Params {
  callId: number
  candidate: string
}

export default async function sendIceCandidate(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { callId, candidate } = req.params
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const call = await retoolDb.query<{ id: number }>(
    `SELECT id FROM calls WHERE id = $1 AND (caller_id = $2 OR callee_id = $3)`,
    [callId, myProfileId, myProfileId],
  )
  if (call.data.length === 0) throw new Error('Call not found.')

  const inserted = await retoolDb.query(
    `INSERT INTO call_ice_candidates (call_id, sender_id, candidate) VALUES ($1, $2, $3) RETURNING *`,
    [callId, myProfileId, candidate],
  )
  return inserted.data[0]
}
