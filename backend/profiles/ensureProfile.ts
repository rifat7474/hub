/**
 * Ensures a profile row exists for the current authenticated user, creating it on first
 * visit and keeping name/avatar in sync with the Retool identity on every call.
 */

interface Params {}

export default async function ensureProfile(req: { params: Params; user: User }) {
  const { user } = req
  const userId = String(user.id)
  const fullName = user.fullName || user.email
  const avatarUrl = user.profilePhotoUrl ?? null

  const existing = await retoolDb.query<{ id: number }>(
    'SELECT id FROM profiles WHERE user_id = $1',
    [userId],
  )

  if (existing.data.length > 0) {
    const updated = await retoolDb.query(
      `UPDATE profiles SET email = $1, full_name = $2, avatar_url = $3, updated_at = now()
       WHERE user_id = $4 RETURNING *`,
      [user.email, fullName, avatarUrl, userId],
    )
    return updated.data[0]
  }

  const created = await retoolDb.query(
    `INSERT INTO profiles (user_id, email, full_name, avatar_url, bio)
     VALUES ($1, $2, $3, $4, '') RETURNING *`,
    [userId, user.email, fullName, avatarUrl],
  )
  return created.data[0]
}
