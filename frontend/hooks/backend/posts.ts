import { createFirestoreHook } from './client'
import type { FeedPost, PostComment } from '../../utils/types'
import { db } from '../../lib/firebase'
import { CURRENT_PROFILE_ID } from './profiles'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'

export const useGetFeed = createFirestoreHook<{ limit?: number; beforeId?: number }, FeedPost[]>(
  async () => {
    const myId = CURRENT_PROFILE_ID

    // Fetch friendships to determine allowed author IDs
    const friendshipsSnap = await getDocs(collection(db, 'friendships'))
    const friendIds = new Set<number>([myId])
    friendshipsSnap.docs.forEach((d) => {
      const f = d.data()
      if (f.status === 'accepted') {
        if (f.requester_id === myId) friendIds.add(f.recipient_id)
        if (f.recipient_id === myId) friendIds.add(f.requester_id)
      }
    })

    // Fetch posts, likes, comments, profiles
    const [postsSnap, likesSnap, commentsSnap, profilesSnap] = await Promise.all([
      getDocs(collection(db, 'posts')),
      getDocs(collection(db, 'likes')),
      getDocs(collection(db, 'comments')),
      getDocs(collection(db, 'profiles')),
    ])

    const profilesMap = new Map<number, any>()
    profilesSnap.docs.forEach((d) => {
      const p = d.data()
      profilesMap.set(p.id, p)
    })

    const allLikes = likesSnap.docs.map((d) => d.data())
    const allComments = commentsSnap.docs.map((d) => d.data())

    const feed: FeedPost[] = []

    postsSnap.docs.forEach((d) => {
      const p = d.data()
      if (!friendIds.has(p.author_id)) return

      const author = profilesMap.get(p.author_id)
      const postLikes = allLikes.filter((l: any) => l.post_id === p.id)
      const postComments = allComments.filter((c: any) => c.post_id === p.id)
      const likedByMe = postLikes.some((l: any) => l.profile_id === myId)

      feed.push({
        id: p.id,
        author_id: p.author_id,
        content: p.content,
        image_url: p.image_url || null,
        created_at: p.created_at,
        author_name: p.author_name || author?.full_name || 'Unknown',
        author_avatar: p.author_avatar || author?.avatar_url || null,
        like_count: postLikes.length,
        comment_count: postComments.length,
        liked_by_me: likedByMe,
      })
    })

    feed.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    return feed
  },
)

export const useCreatePost = createFirestoreHook<{ content: string; imageUrl?: string }, FeedPost>(
  async ({ content, imageUrl }) => {
    const myProfileSnap = await getDoc(doc(db, 'profiles', String(CURRENT_PROFILE_ID)))
    const myProfile = myProfileSnap.data() || {
      id: CURRENT_PROFILE_ID,
      full_name: 'Alex Rivera',
      avatar_url: null,
    }

    const postId = Date.now()
    const newPost: FeedPost = {
      id: postId,
      author_id: myProfile.id,
      content: content.trim(),
      image_url: imageUrl || null,
      created_at: new Date().toISOString(),
      author_name: myProfile.full_name,
      author_avatar: myProfile.avatar_url,
      like_count: 0,
      comment_count: 0,
      liked_by_me: false,
    }

    await setDoc(doc(db, 'posts', String(postId)), {
      id: newPost.id,
      author_id: newPost.author_id,
      content: newPost.content,
      image_url: newPost.image_url,
      created_at: newPost.created_at,
      author_name: newPost.author_name,
      author_avatar: newPost.author_avatar,
    })

    return newPost
  },
)

export const useDeletePost = createFirestoreHook<{ postId: number }, { success: boolean }>(
  async ({ postId }) => {
    await deleteDoc(doc(db, 'posts', String(postId)))
    return { success: true }
  },
)

export const useToggleLike = createFirestoreHook<{ postId: number }, { liked: boolean }>(
  async ({ postId }) => {
    const myId = CURRENT_PROFILE_ID
    const likeDocId = `${postId}_${myId}`
    const likeRef = doc(db, 'likes', likeDocId)
    const snap = await getDoc(likeRef)

    if (snap.exists()) {
      await deleteDoc(likeRef)
      return { liked: false }
    } else {
      await setDoc(likeRef, { post_id: postId, profile_id: myId })
      return { liked: true }
    }
  },
)

export const useGetComments = createFirestoreHook<{ postId: number }, PostComment[]>(
  async ({ postId }) => {
    const commentsSnap = await getDocs(
      query(collection(db, 'comments'), where('post_id', '==', Number(postId))),
    )

    const list: PostComment[] = commentsSnap.docs.map((d) => d.data() as PostComment)
    list.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    return list
  },
)

export const useAddComment = createFirestoreHook<{ postId: number; content: string }, PostComment>(
  async ({ postId, content }) => {
    const myProfileSnap = await getDoc(doc(db, 'profiles', String(CURRENT_PROFILE_ID)))
    const myProfile = myProfileSnap.data() || {
      id: CURRENT_PROFILE_ID,
      full_name: 'Alex Rivera',
      avatar_url: null,
    }

    const commentId = Date.now()
    const newComment: PostComment = {
      id: commentId,
      post_id: Number(postId),
      profile_id: myProfile.id,
      author_name: myProfile.full_name,
      author_avatar: myProfile.avatar_url,
      content: content.trim(),
      created_at: new Date().toISOString(),
    }

    await setDoc(doc(db, 'comments', String(commentId)), newComment)
    return newComment
  },
)
