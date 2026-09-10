import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useEnsureProfile } from '../hooks/backend/profiles'

export interface Profile {
  id: number
  user_id: string
  email: string
  full_name: string
  avatar_url: string | null
  bio: string
}

interface ProfileContextValue {
  profile: Profile | null
  loading: boolean
  error: string | null
  refresh: () => void
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, trigger } = useEnsureProfile()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    trigger()
  }, [trigger])

  useEffect(() => {
    if (data) setProfile(data as Profile)
  }, [data])

  return (
    <ProfileContext.Provider
      value={{ profile, loading, error, refresh: () => trigger({}, { skipCache: true }) }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider')
  return ctx
}
