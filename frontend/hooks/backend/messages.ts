import { createFirestoreHook } from './client'
import type { Conversation, ChatMessage } from '../../utils/types'
import { db } from '../../lib/firebase'
import { CURRENT_PROFILE_ID } from './profiles'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

export const useGetConversations = createFirestoreHook<void, Conversation[]>(async () => {
  const myId = CURRENT_PROFILE_ID
  const [friendshipsSnap, profilesSnap, messagesSnap] = await Promise.all([
    getDocs(collection(db, 'friendships')),
    getDocs(collection(db, 'profiles')),
    getDocs(collection(db, 'messages')),
  ])

  const friendIds = new Set<number>()
  friendshipsSnap.docs.forEach((d) => {
    const f = d.data()
    if (f.status === 'accepted') {
      if (f.requester_id === myId) friendIds.add(f.recipient_id)
      if (f.recipient_id === myId) friendIds.add(f.requester_id)
    }
  })

  const profilesMap = new Map<number, any>()
  profilesSnap.docs.forEach((d) => {
    const p = d.data()
    profilesMap.set(p.id, p)
  })

  const allMessages = messagesSnap.docs.map((d) => d.data() as ChatMessage)

  const convos: Conversation[] = []

  friendIds.forEach((fId) => {
    const friend = profilesMap.get(fId)
    const thread = allMessages
      .filter(
        (m) =>
          (m.sender_id === myId && m.recipient_id === fId) ||
          (m.sender_id === fId && m.recipient_id === myId),
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const lastMsg = thread[0]
    const unreadCount = thread.filter((m) => m.sender_id === fId && !m.read_at).length

    convos.push({
      friend_id: fId,
      full_name: friend?.full_name ?? 'Unknown',
      avatar_url: friend?.avatar_url ?? null,
      last_message: lastMsg?.content ?? null,
      last_message_at: lastMsg?.created_at ?? null,
      last_sender_id: lastMsg?.sender_id ?? null,
      unread_count: unreadCount,
    })
  })

  convos.sort((a, b) => {
    if (!a.last_message_at) return 1
    if (!b.last_message_at) return -1
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  })

  return convos
})

export const useGetMessages = createFirestoreHook<{ friendId: number }, ChatMessage[]>(
  async ({ friendId }) => {
    const myId = CURRENT_PROFILE_ID
    const fId = Number(friendId)
    const snap = await getDocs(collection(db, 'messages'))

    const thread: ChatMessage[] = []
    snap.docs.forEach((d) => {
      const m = d.data() as ChatMessage
      if (
        (m.sender_id === myId && m.recipient_id === fId) ||
        (m.sender_id === fId && m.recipient_id === myId)
      ) {
        thread.push(m)
      }
    })

    thread.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    return thread
  },
)

export const useSendMessage = createFirestoreHook<
  { friendId: number; content: string },
  ChatMessage
>(async ({ friendId, content }) => {
  const myId = CURRENT_PROFILE_ID
  const msgId = Date.now()
  const newMsg: ChatMessage = {
    id: msgId,
    sender_id: myId,
    recipient_id: Number(friendId),
    content: content.trim(),
    created_at: new Date().toISOString(),
    read_at: null,
  }

  await setDoc(doc(db, 'messages', String(msgId)), newMsg)
  return newMsg
})

export const useMarkRead = createFirestoreHook<{ friendId: number }, { success: boolean }>(
  async ({ friendId }) => {
    const myId = CURRENT_PROFILE_ID
    const fId = Number(friendId)
    const snap = await getDocs(collection(db, 'messages'))

    const updates = snap.docs
      .filter((d) => {
        const m = d.data()
        return m.sender_id === fId && m.recipient_id === myId && !m.read_at
      })
      .map((d) => updateDoc(doc(db, 'messages', d.id), { read_at: new Date().toISOString() }))

    await Promise.all(updates)
    return { success: true }
  },
)
