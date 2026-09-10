/** Fetch a single call by id (must involve the current user). */

interface Params {
  callId: number
}

export default async function getCallById(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { callId } = req.params
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) return null

  const result = await retoolDb.query(
    `SELECT id, caller_id, callee_id, call_type, status, offer, answer, created_at, updated_at
     FROM calls WHERE id = $1 AND (caller_id = $2 OR callee_id = $3)`,
    [callId, myProfileId, myProfileId],
  )
  return result.data[0] ?? null
}
