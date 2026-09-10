/** Create a new post for the current user. */

interface Params {
  content: string
  imageUrl?: string
}

export default async function createPost(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { content, imageUrl } = req.params
  if (!content?.trim() && !imageUrl) {
    throw new Error('Post must have content or an image.')
  }

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found. Call ensureProfile first.')

  const inserted = await retoolDb.query(
    `INSERT INTO posts (author_id, content, image_url) VALUES ($1, $2, $3) RETURNING *`,
    [myProfileId, content?.trim() ?? '', imageUrl ?? null],
  )
  return inserted.data[0]
}
