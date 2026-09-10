/** Answer an incoming call with the WebRTC answer SDP. Only the callee may answer. */

interface Params {
  callId: number
  answer: string
}

export default async function answerCall(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { callId, answer } = req.params
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const result = await retoolDb.query(
    `UPDATE calls SET answer = $1, status = 'accepted', updated_at = now()
     WHERE id = $2 AND callee_id = $3 AND status = 'ringing' RETURNING *`,
    [answer, callId, myProfileId],
  )
  if (result.data.length === 0) throw new Error('Call not found or no longer ringing.')
  return result.data[0]
}
