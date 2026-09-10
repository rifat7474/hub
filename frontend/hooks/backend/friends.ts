import { createFirestoreHook } from './client'
import type { FriendProfile, FriendRequestRow } from '../../utils/types'
import { db } from '../../lib/firebase'
import { CURRENT_PROFILE_ID } from './profiles'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'

export const useGetFriends = createFirestoreHook<void, FriendProfile[]>(async () => {
  const myId = CURRENT_PROFILE_ID
  const [friendshipsSnap, profilesSnap] = await Promise.all([
    getDocs(collection(db, 'friendships')),
    getDocs(collection(db, 'profiles')),
  ])

  const friendIds = new Set<number>()
  friendshipsSnap.docs.forEach((d) => {
    const f = d.data()
    if (f.status === 'accepted') {
      if (f.requester_id === myId) friendIds.add(f.recipient_id)
      if (f.recipient_id === myId) friendIds.add(f.requester_id)
    }
  })

  const friends: FriendProfile[] = []
  profilesSnap.docs.forEach((d) => {
    const p = d.data()
    if (friendIds.has(p.id)) {
      friends.push({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url || null,
        bio: p.bio || '',
      })
    }
  })

  return friends
})

export const useGetFriendRequests = createFirestoreHook<
  void,
  { incoming: FriendRequestRow[]; outgoing: FriendRequestRow[] }
>(async () => {
  const myId = CURRENT_PROFILE_ID
  const [friendshipsSnap, profilesSnap] = await Promise.all([
    getDocs(collection(db, 'friendships')),
    getDocs(collection(db, 'profiles')),
  ])

  const profilesMap = new Map<number, any>()
  profilesSnap.docs.forEach((d) => {
    const p = d.data()
    profilesMap.set(p.id, p)
  })

  const incoming: FriendRequestRow[] = []
  const outgoing: FriendRequestRow[] = []

  friendshipsSnap.docs.forEach((d) => {
    const f = d.data()
    if (f.status !== 'pending') return

    if (f.recipient_id === myId) {
      const sender = profilesMap.get(f.requester_id)
      incoming.push({
        friendship_id: f.id,
        id: sender?.id ?? f.requester_id,
        full_name: sender?.full_name ?? 'Unknown',
        email: sender?.email ?? '',
        avatar_url: sender?.avatar_url ?? null,
        created_at: f.created_at,
      })
    } else if (f.requester_id === myId) {
      const recipient = profilesMap.get(f.recipient_id)
      outgoing.push({
        friendship_id: f.id,
        id: recipient?.id ?? f.recipient_id,
        full_name: recipient?.full_name ?? 'Unknown',
        email: recipient?.email ?? '',
        avatar_url: recipient?.avatar_url ?? null,
        created_at: f.created_at,
      })
    }
  })

  return { incoming, outgoing }
})

export const useSendFriendRequest = createFirestoreHook<{ recipientId: number }, { success: boolean }>(
  async ({ recipientId }) => {
    const myId = CURRENT_PROFILE_ID
    const rId = Number(recipientId)
    const friendshipsSnap = await getDocs(collection(db, 'friendships'))

    const existing = friendshipsSnap.docs.find((d) => {
      const f = d.data()
      return (
        (f.requester_id === myId && f.recipient_id === rId) ||
        (f.requester_id === rId && f.recipient_id === myId)
      )
    })

    if (!existing) {
      const friendshipId = Date.now()
      await setDoc(doc(db, 'friendships', String(friendshipId)), {
        id: friendshipId,
        requester_id: myId,
        recipient_id: rId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    }

    return { success: true }
  },
)

export const useRespondFriendRequest = createFirestoreHook<
  { friendshipId: number; accept: boolean },
  { success: boolean }
>(async ({ friendshipId, accept }) => {
  const fRef = doc(db, 'friendships', String(friendshipId))
  await updateDoc(fRef, {
    status: accept ? 'accepted' : 'declined',
  })
  return { success: true }
})

export const useRemoveFriend = createFirestoreHook<{ friendId: number }, { success: boolean }>(
  async ({ friendId }) => {
    const myId = CURRENT_PROFILE_ID
    const targetId = Number(friendId)
    const friendshipsSnap = await getDocs(collection(db, 'friendships'))

    const found = friendshipsSnap.docs.find((d) => {
      const f = d.data()
      return (
        (f.requester_id === myId && f.recipient_id === targetId) ||
        (f.requester_id === targetId && f.recipient_id === myId)
      )
    })

    if (found) {
      await deleteDoc(doc(db, 'friendships', found.id))
    }

    return { success: true }
  },
)
