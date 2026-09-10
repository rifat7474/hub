import { useEffect } from 'react'
import { useGetMyAdminStatus } from './backend/admin'

/**
 * Real admin check backed by profiles.is_admin (see /backend/admin/authz.ts).
 * Used for UI gating; the backend still enforces this independently on every
 * admin call, so this hook never needs to be treated as the security boundary.
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { data, loading, trigger } = useGetMyAdminStatus()

  useEffect(() => {
    trigger()
  }, [trigger])

  return { isAdmin: data?.isAdmin ?? false, loading: loading && data == null }
}
