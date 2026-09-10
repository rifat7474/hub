import { requireAdmin } from './authz'

interface Params {
  profileId: number
  isAdmin: boolean
}

/** Grant or revoke admin access for a profile. Admin-only. */
export default async function setAdminStatus(req: { params: Params; user: User }) {
  await requireAdmin(req.user)
  const { profileId, isAdmin: nextIsAdmin } = req.params

  const result = await retoolDb.query(
    `UPDATE profiles SET is_admin = $1 WHERE id = $2 RETURNING id, full_name, is_admin`,
    [nextIsAdmin, profileId],
  )
  if (result.data.length === 0) throw new Error('Profile not found.')
  return result.data[0]
}
