/** Fetch a single profile by its profile id. */

interface Params {
  profileId: number
}

export default async function getProfile(req: { params: Params; user: User }) {
  const { profileId } = req.params
  const result = await retoolDb.query(
    'SELECT id, user_id, email, full_name, avatar_url, bio, created_at FROM profiles WHERE id = $1',
    [profileId],
  )
  return result.data[0] ?? null
}
