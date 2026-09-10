/**
 * Poll for the current user's active call (ringing or accepted), as either caller or
 * callee. Used to detect incoming calls and to observe status changes (declined/ended).
 */

export default async function getActiveCall(req: { params: {}; user: User }) {
  const userId = String(req.user.id)
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) return null

  const result = await retoolDb.query(
    `SELECT c.id, c.caller_id, c.callee_id, c.call_type, c.status, c.offer, c.answer, c.created_at, c.updated_at,
            pr.full_name AS other_name, pr.avatar_url AS other_avatar
     FROM calls c
     JOIN profiles pr ON pr.id = CASE WHEN c.caller_id = $1 THEN c.callee_id ELSE c.caller_id END
     WHERE c.status IN ('ringing', 'accepted') AND (c.caller_id = $2 OR c.callee_id = $3)
     ORDER BY c.id DESC LIMIT 1`,
    [myProfileId, myProfileId, myProfileId],
  )
  return result.data[0] ?? null
}
