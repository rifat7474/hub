import { createFirestoreHook } from './client'
import { db } from '../../lib/firebase'
import { CURRENT_PROFILE_ID } from './profiles'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

export const useStartCall = createFirestoreHook<{
  peerId?: number
  calleeId?: number
  type?: string
  callType?: string
  offer: string
}>(async ({ peerId, calleeId, type, callType, offer }) => {
  const myId = CURRENT_PROFILE_ID
  const targetId = Number(calleeId || peerId)
  const resolvedType = (callType || type || 'video') as 'audio' | 'video'
  const callId = Date.now()

  const callDoc = {
    id: callId,
    caller_id: myId,
    callee_id: targetId,
    call_type: resolvedType,
    status: 'outgoing',
    offer,
    created_at: new Date().toISOString(),
  }

  await setDoc(doc(db, 'calls', String(callId)), callDoc)
  return callDoc
})

export const useGetActiveCall = createFirestoreHook<void, any>(async () => {
  const myId = CURRENT_PROFILE_ID
  const [callsSnap, profilesSnap] = await Promise.all([
    getDocs(collection(db, 'calls')),
    getDocs(collection(db, 'profiles')),
  ])

  const profilesMap = new Map<number, any>()
  profilesSnap.docs.forEach((d) => {
    const p = d.data()
    profilesMap.set(p.id, p)
  })

  // Find most recent active or outgoing call
  const activeCalls = callsSnap.docs
    .map((d) => d.data())
    .filter(
      (c) =>
        (c.caller_id === myId || c.callee_id === myId) &&
        (c.status === 'outgoing' || c.status === 'active'),
    )
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

  const active = activeCalls[0]
  if (!active) return null

  const otherId = active.caller_id === myId ? active.callee_id : active.caller_id
  const other = profilesMap.get(otherId)

  return {
    ...active,
    peer_name: other?.full_name ?? 'Unknown',
    peer_avatar: other?.avatar_url ?? null,
    is_incoming: active.callee_id === myId && active.status === 'outgoing',
  }
})

export const useAnswerCall = createFirestoreHook<{ callId: number; answer: string }>(
  async ({ callId, answer }) => {
    const callRef = doc(db, 'calls', String(callId))
    await updateDoc(callRef, {
      status: 'active',
      answer,
    })
    return { success: true, id: callId }
  },
)

export const useDeclineCall = createFirestoreHook<{ callId: number }>(
  async ({ callId }) => {
    const callRef = doc(db, 'calls', String(callId))
    await updateDoc(callRef, {
      status: 'declined',
    })
    return { success: true }
  },
)

export const useEndCall = createFirestoreHook<{ callId: number }>(
  async ({ callId }) => {
    const callRef = doc(db, 'calls', String(callId))
    await updateDoc(callRef, {
      status: 'ended',
    })
    return { success: true }
  },
)

export const useSendIceCandidate = createFirestoreHook<{ callId: number; candidate: any }>(
  async ({ callId, candidate }) => {
    const myId = CURRENT_PROFILE_ID
    const candId = Date.now()
    await setDoc(doc(db, 'iceCandidates', String(candId)), {
      id: candId,
      call_id: Number(callId),
      sender_id: myId,
      candidate,
      created_at: new Date().toISOString(),
    })
    return { success: true }
  },
)

export const useGetIceCandidates = createFirestoreHook<{ callId: number; afterId?: number }>(
  async ({ callId, afterId = 0 }) => {
    const myId = CURRENT_PROFILE_ID
    const cId = Number(callId)
    const after = Number(afterId)

    const snap = await getDocs(collection(db, 'iceCandidates'))
    const list = snap.docs
      .map((d) => d.data())
      .filter((c) => c.call_id === cId && c.sender_id !== myId && c.id > after)
      .sort((a, b) => a.id - b.id)

    return list
  },
)
