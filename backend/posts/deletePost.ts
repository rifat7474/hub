/** Delete a post if it belongs to the current user. */

interface Params {
  postId: number
}

export default async function deletePost(req: { params: Params; user: User }) {
  const userId = String(req.user.id)
  const { postId } = req.params

  const me = await retoolDb.query<{ id: number }>('SELECT id FROM profiles WHERE user_id = $1', [userId])
  const myProfileId = me.data[0]?.id
  if (!myProfileId) throw new Error('Profile not found.')

  const result = await retoolDb.deleteBy({
    tableName: 'posts',
    filterBy: [
      { key: 'id', operation: '=', value: postId },
      { key: 'author_id', operation: '=', value: myProfileId },
    ],
    enableBulkUpdates: true,
    doNotThrowOnNoOp: true,
  })
  const affected = (result.data as unknown as { result: number }).result
  return { deleted: affected > 0 }
}
