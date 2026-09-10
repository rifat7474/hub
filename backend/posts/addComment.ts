/** Add a comment to a post as the current user. */

interface Params {
  postId: number
  content: string
}

export default async function addComment(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { postId, content } = req.params
  if (!content?.trim()) throw new Error('Comment cannot be empty.')

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const inserted = await retoolDb.query(
    `INSERT INTO comments (post_id, profile_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [postId, myProfileId, content.trim()],
  )
  const withAuthor = await retoolDb.query(
    `SELECT c.id, c.content, c.created_at, c.profile_id, pr.full_name AS author_name, pr.avatar_url AS author_avatar
     FROM comments c JOIN profiles pr ON pr.id = c.profile_id WHERE c.id = $1`,
    [inserted.data[0]!['id']],
  )
  return withAuthor.data[0]
}
