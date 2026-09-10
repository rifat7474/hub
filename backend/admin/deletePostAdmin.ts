import { requireAdmin } from './authz'

interface Params {
  postId: number
}

/** Delete any post regardless of ownership. Admin-only moderation action. */
export default async function deletePostAdmin(req: { params: Params; user: User }) {
  await requireAdmin(req.user)

  const result = await retoolDb.deleteBy({
    tableName: 'posts',
    filterBy: [{ key: 'id', operation: '=', value: req.params.postId }],
    doNotThrowOnNoOp: true,
  })
  const affected = (result.data as unknown as { result: number }).result
  return { deleted: affected > 0 }
}
