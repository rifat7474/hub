import { createFirestoreHook } from './client'
import { db } from '../../lib/firebase'
import { CURRENT_PROFILE_ID } from './profiles'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'

export const useGetStats = createFirestoreHook<void, any>(async () => {
  const [profilesSnap, postsSnap, friendshipsSnap, callsSnap] = await Promise.all([
    getDocs(collection(db, 'profiles')),
    getDocs(collection(db, 'posts')),
    getDocs(collection(db, 'friendships')),
    getDocs(collection(db, 'calls')),
  ])

  const totalUsers = profilesSnap.size
  const totalPosts = postsSnap.size
  const activeFriendships = friendshipsSnap.docs.filter((d) => d.data().status === 'accepted').length
  const activeCalls = callsSnap.docs.filter((d) => d.data().status === 'active').length

  return {
    totalUsers,
    totalPosts,
    activeFriendships,
    activeCalls,
    activityHistory: [
      { name: 'Mon', posts: 12, calls: 4, messages: 45 },
      { name: 'Tue', posts: 19, calls: 8, messages: 62 },
      { name: 'Wed', posts: 15, calls: 6, messages: 53 },
      { name: 'Thu', posts: 24, calls: 11, messages: 84 },
      { name: 'Fri', posts: 28, calls: 15, messages: 97 },
      { name: 'Sat', posts: 32, calls: 18, messages: 120 },
      { name: 'Sun', posts: 26, calls: 12, messages: 90 },
    ],
  }
})

export const useGetAllProfiles = createFirestoreHook<void, any[]>(async () => {
  const snap = await getDocs(collection(db, 'profiles'))
  return snap.docs.map((d) => d.data())
})

export const useGetAllPosts = createFirestoreHook<void, any[]>(async () => {
  const [postsSnap, profilesSnap, likesSnap, commentsSnap] = await Promise.all([
    getDocs(collection(db, 'posts')),
    getDocs(collection(db, 'profiles')),
    getDocs(collection(db, 'likes')),
    getDocs(collection(db, 'comments')),
  ])

  const profilesMap = new Map<number, any>()
  profilesSnap.docs.forEach((d) => {
    const p = d.data()
    profilesMap.set(p.id, p)
  })

  const allLikes = likesSnap.docs.map((d) => d.data())
  const allComments = commentsSnap.docs.map((d) => d.data())

  return postsSnap.docs.map((d) => {
    const p = d.data()
    const author = profilesMap.get(p.author_id)
    return {
      id: p.id,
      content: p.content,
      image_url: p.image_url || null,
      created_at: p.created_at,
      author_id: p.author_id,
      author_name: p.author_name || author?.full_name || 'Unknown',
      author_avatar: p.author_avatar || author?.avatar_url || null,
      like_count: allLikes.filter((l: any) => l.post_id === p.id).length,
      comment_count: allComments.filter((c: any) => c.post_id === p.id).length,
    }
  })
})

export const useDeletePostAdmin = createFirestoreHook<{ postId: number }, { success: boolean }>(
  async ({ postId }) => {
    await deleteDoc(doc(db, 'posts', String(postId)))
    return { success: true }
  },
)

export const useSetAdminStatus = createFirestoreHook<
  { profileId: number; isAdmin: boolean },
  { success: boolean }
>(async ({ profileId, isAdmin }) => {
  const pRef = doc(db, 'profiles', String(profileId))
  await updateDoc(pRef, { is_admin: Boolean(isAdmin) })
  return { success: true }
})

export const useGetMyAdminStatus = createFirestoreHook<void, { isAdmin: boolean }>(async () => {
  const pRef = doc(db, 'profiles', String(CURRENT_PROFILE_ID))
  const snap = await getDoc(pRef)
  if (snap.exists()) {
    return { isAdmin: snap.data().is_admin ?? true }
  }
  return { isAdmin: true }
})
