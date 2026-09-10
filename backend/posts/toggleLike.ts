/** Toggle a like on a post for the current user. Returns the new liked state and count. */

interface Params {
  postId: number
}

export default async function toggleLike(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { postId } = req.params

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const existing = await retoolDb.query<{ id: number }>(
    'SELECT id FROM likes WHERE post_id = $1 AND profile_id = $2',
    [postId, myProfileId],
  )

  if (existing.data.length > 0) {
    await retoolDb.deleteBy({
      tableName: 'likes',
      filterBy: [{ key: 'id', operation: '=', value: existing.data[0]!.id }],
    })
  } else {
    await retoolDb.insert({
      tableName: 'likes',
      changeset: { post_id: postId, profile_id: myProfileId },
    })
  }

  const count = await retoolDb.query<{ count: string }>(
    'SELECT COUNT(*) AS count FROM likes WHERE post_id = $1',
    [postId],
  )
  return { liked: existing.data.length === 0, likeCount: Number(count.data[0]?.count ?? 0) }
}
