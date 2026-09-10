/** Update the current user's editable profile fields (bio, avatar). */

interface Params {
  bio?: string
  avatarUrl?: string
}

export default async function updateProfile(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { bio, avatarUrl } = req.params

  const existing = await retoolDb.query<{ id: number; bio: string; avatar_url: string | null }>(
    'SELECT id, bio, avatar_url FROM profiles WHERE user_id = $1',
    [userId],
  )
  const current = existing.data[0]
  if (!current) {
    throw new Error('Profile not found. Call ensureProfile first.')
  }

  const nextBio = bio !== undefined ? bio : current.bio
  const nextAvatar = avatarUrl !== undefined ? avatarUrl : current.avatar_url

  const updated = await retoolDb.query(
    `UPDATE profiles SET bio = $1, avatar_url = $2, updated_at = now()
     WHERE user_id = $3 RETURNING *`,
    [nextBio, nextAvatar, userId],
  )
  return updated.data[0]
}
