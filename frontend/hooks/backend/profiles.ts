import { createFirestoreHook } from './client'
import type { SearchResultProfile } from '../../utils/types'
import type { Profile } from '../useProfileContext'
import { db, ensureAuth, seedInitialFirestoreData } from '../../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

export const CURRENT_PROFILE_ID = 1

export const useEnsureProfile = createFirestoreHook<void, Profile>(async () => {
  await ensureAuth()
  await seedInitialFirestoreData()

  const profileRef = doc(db, 'profiles', String(CURRENT_PROFILE_ID))
  const snap = await getDoc(profileRef)

  if (snap.exists()) {
    return snap.data() as Profile
  }

  const defaultProfile: Profile = {
    id: CURRENT_PROFILE_ID,
    user_id: 'user_1',
    email: 'alex.rivera@example.com',
    full_name: 'Alex Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Product designer & engineer. Building next-gen social platforms on Firebase.',
  }
  await setDoc(profileRef, defaultProfile)
  return defaultProfile
})

export const useSearchProfiles = createFirestoreHook<{ query: string }, SearchResultProfile[]>(
  async ({ query = '' }) => {
    const qLower = query.toLowerCase().trim()
    const profilesSnap = await getDocs(collection(db, 'profiles'))
    const friendshipsSnap = await getDocs(collection(db, 'friendships'))

    const myId = CURRENT_PROFILE_ID
    const allFriendships = friendshipsSnap.docs.map((d) => d.data())

    const results: SearchResultProfile[] = []

    profilesSnap.docs.forEach((docSnap) => {
      const p = docSnap.data() as Profile
      if (p.id === myId) return

      const matches =
        !qLower ||
        p.full_name.toLowerCase().includes(qLower) ||
        p.email.toLowerCase().includes(qLower)

      if (matches) {
        let friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' = 'none'
        const f = allFriendships.find(
          (fr: any) =>
            (fr.requester_id === myId && fr.recipient_id === p.id) ||
            (fr.requester_id === p.id && fr.recipient_id === myId),
        )
        if (f) {
          if (f.status === 'accepted') friendshipStatus = 'friends'
          else if (f.requester_id === myId) friendshipStatus = 'pending_sent'
          else friendshipStatus = 'pending_received'
        }

        results.push({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          avatar_url: p.avatar_url,
          bio: p.bio,
          friendshipStatus,
        })
      }
    })

    return results
  },
)

export const useUpdateProfile = createFirestoreHook<{ bio?: string; avatarUrl?: string }, Profile>(
  async (params) => {
    const profileRef = doc(db, 'profiles', String(CURRENT_PROFILE_ID))
    const snap = await getDoc(profileRef)
    const existing = (snap.data() || {}) as Profile

    const updated: Record<string, unknown> = {}
    if (params?.bio !== undefined) updated.bio = params.bio
    if (params?.avatarUrl !== undefined) updated.avatar_url = params.avatarUrl

    await updateDoc(profileRef, updated)
    return { ...existing, ...updated } as Profile
  },
)
