/**
 * Search profiles by name or email (excludes the current user), annotated with the
 * current friendship status between the searcher and each result.
 */

interface Params {
  query: string
}

export default async function searchProfiles(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const q = `%${req.params.query.trim().toLowerCase()}%`

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id ?? null

  const results = await retoolDb.query<{
    id: number
    full_name: string
    email: string
    avatar_url: string | null
    bio: string
  }>(
    `SELECT id, full_name, email, avatar_url, bio FROM profiles
     WHERE user_id != $1 AND (LOWER(full_name) LIKE $2 OR LOWER(email) LIKE $3)
     ORDER BY full_name ASC LIMIT 25`,
    [userId, q, q],
  )

  if (!myProfileId || results.data.length === 0) {
    return results.data.map((p) => ({ ...p, friendshipStatus: 'none' as const }))
  }

  const ids = results.data.map((p) => p.id)
  const friendships = await retoolDb.query<{
    requester_id: number
    recipient_id: number
    status: string
  }>(
    `SELECT requester_id, recipient_id, status FROM friendships
     WHERE (requester_id = $1 AND recipient_id = ANY($2))
        OR (recipient_id = $3 AND requester_id = ANY($4))`,
    [myProfileId, ids, myProfileId, ids],
  )

  return results.data.map((p) => {
    const rel = friendships.data.find(
      (f) => f.requester_id === p.id || f.recipient_id === p.id,
    )
    let friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' = 'none'
    if (rel) {
      if (rel.status === 'accepted') friendshipStatus = 'friends'
      else if (rel.status === 'pending') {
        friendshipStatus = rel.requester_id === myProfileId ? 'pending_sent' : 'pending_received'
      }
    }
    return { ...p, friendshipStatus }
  })
}
