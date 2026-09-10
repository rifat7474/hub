/**
 * Poll for new ICE candidates from the other participant in a call, sent after `afterId`.
 * Never returns the current user's own candidates.
 */

interface Params {
  callId: number
  afterId?: number
}

export default async function getIceCandidates(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { callId } = req.params
  const afterId = req.params.afterId ?? 0
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) return []

  const result = await retoolDb.query(
    `SELECT id, candidate, sender_id FROM call_ice_candidates
     WHERE call_id = $1 AND id > $2 AND sender_id != $3
     ORDER BY id ASC`,
    [callId, afterId, myProfileId],
  )
  return result.data
}
