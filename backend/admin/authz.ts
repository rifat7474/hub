/**
 * Shared authorization helper for admin-only backend functions.
 * Admin status is a real flag on the profiles row (profiles.is_admin) rather than a
 * guess from Retool group names, since group naming conventions vary by org. Org
 * members in a group whose name contains "admin" are also treated as admins as a
 * bootstrap fallback so at least one person can reach the dashboard and promote others.
 */

export async function isAdmin(user: User): Promise<boolean> {
  const result = await retoolDb.query<{ is_admin: boolean }>(
    'SELECT is_admin FROM profiles WHERE user_id = $1',
    [String(user.id)],
  )
  if (result.data[0]?.is_admin) return true
  return user.groups.some((g) => /admin/i.test(g.name))
}

export async function requireAdmin(user: User): Promise<void> {
  if (!(await isAdmin(user))) {
    throw new Error('You do not have permission to access the admin dashboard.')
  }
}
