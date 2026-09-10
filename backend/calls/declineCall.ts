/** Decline an incoming call. Only the callee may decline. */

interface Params {
  callId: number
}

export default async function declineCall(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { callId } = req.params
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const result = await retoolDb.query(
    `UPDATE calls SET status = 'declined', updated_at = now()
     WHERE id = $1 AND callee_id = $2 AND status = 'ringing' RETURNING *`,
    [callId, myProfileId],
  )
  return { declined: result.data.length > 0 }
}
