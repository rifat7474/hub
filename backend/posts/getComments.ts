/** List comments for a post, oldest first, with author info. */

interface Params {
  postId: number
}

export default async function getComments(req: { params: Params; user: User }) {
  const { postId } = req.params
  const result = await retoolDb.query(
    `SELECT c.id, c.content, c.created_at, c.profile_id, pr.full_name AS author_name, pr.avatar_url AS author_avatar
     FROM comments c
     JOIN profiles pr ON pr.id = c.profile_id
     WHERE c.post_id = $1
     ORDER BY c.id ASC`,
    [postId],
  )
  return result.data
}
