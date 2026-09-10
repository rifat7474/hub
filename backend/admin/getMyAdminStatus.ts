import { isAdmin } from './authz'

/** Reports whether the current user has admin access, for client-side UI gating. */
export default async function getMyAdminStatus(req: { params: {}; user: User }) {
  return { isAdmin: await isAdmin(req.user) }
}
