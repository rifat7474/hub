/** End an active call. Either participant may end it. */

interface Params {
  callId: number
}

export default async function endCall(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { callId } = req.params
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const result = await retoolDb.query(
    `UPDATE calls SET status = 'ended', updated_at = now()
     WHERE id = $1 AND (caller_id = $2 OR callee_id = $3) AND status IN ('ringing', 'accepted') RETURNING *`,
    [callId, myProfileId, myProfileId],
  )
  return { ended: result.data.length > 0 }
}
