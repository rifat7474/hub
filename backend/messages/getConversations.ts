/**
 * List conversations for the current user: one row per friend, with the last message
 * preview and unread count. Ordered by most recent activity.
 */

export default async function getConversations(req: { params: {}; user: User }) {
  const userId = String(req.user.id)
  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) return []

  const result = await retoolDb.query(
    `SELECT
       pr.id AS friend_id, pr.full_name, pr.avatar_url,
       lm.content AS last_message, lm.created_at AS last_message_at, lm.sender_id AS last_sender_id,
       COALESCE(unread.count, 0) AS unread_count
     FROM friendships f
     JOIN profiles pr ON pr.id = CASE WHEN f.requester_id = $1 THEN f.recipient_id ELSE f.requester_id END
     LEFT JOIN LATERAL (
       SELECT content, created_at, sender_id FROM messages
       WHERE (sender_id = $2 AND recipient_id = pr.id) OR (sender_id = pr.id AND recipient_id = $3)
       ORDER BY id DESC LIMIT 1
     ) lm ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS count FROM messages
       WHERE sender_id = pr.id AND recipient_id = $4 AND read_at IS NULL
     ) unread ON true
     WHERE f.status = 'accepted' AND (f.requester_id = $5 OR f.recipient_id = $6)
     ORDER BY lm.created_at DESC NULLS LAST`,
    [myProfileId, myProfileId, myProfileId, myProfileId, myProfileId, myProfileId],
  )
  return result.data
}
