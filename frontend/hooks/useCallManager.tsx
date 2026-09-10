import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useProfile } from './useProfileContext'
import {
  useStartCall,
  useGetActiveCall,
  useAnswerCall,
  useDeclineCall,
  useEndCall,
  useSendIceCandidate,
  useGetIceCandidates,
} from './backend/calls'

export type CallType = 'audio' | 'video'
export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'active'

export interface CallPeerInfo {
  id: number
  name: string
  avatar: string | null
}

interface CallContextValue {
  phase: CallPhase
  callType: CallType | null
  peer: CallPeerInfo | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  micMuted: boolean
  camOff: boolean
  errorMessage: string | null
  startCall: (peer: CallPeerInfo, type: CallType) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMic: () => void
  toggleCam: () => void
  clearError: () => void
}

const CallContext = createContext<CallContextValue | undefined>(undefined)

// Public STUN server for NAT traversal. Published apps enforce connect-src 'self',
// which also governs WebRTC — an admin must add a STUN/TURN origin under
// Settings > App Security > Content Security Policy for calls to reliably connect
// across networks.
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

const ACTIVE_POLL_MS = 3000
const ICE_POLL_MS = 1500

export function CallProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const [phase, setPhase] = useState<CallPhase>('idle')
  const [callType, setCallType] = useState<CallType | null>(null)
  const [peer, setPeer] = useState<CallPeerInfo | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [micMuted, setMicMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const phaseRef = useRef<CallPhase>('idle')
  const callIdRef = useRef<number | null>(null)
  const pendingOfferRef = useRef<string | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream>(new MediaStream())
  const iceCursorRef = useRef<number>(0)
  const pendingIceRef = useRef<string[]>([])
  const remoteDescSetRef = useRef(false)

  const startCallFn = useStartCall()
  const getActiveCallFn = useGetActiveCall()
  const answerCallFn = useAnswerCall()
  const declineCallFn = useDeclineCall()
  const endCallFn = useEndCall()
  const sendIceFn = useSendIceCandidate()
  const getIceFn = useGetIceCandidates()

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  function resetCallState() {
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    remoteStreamRef.current = new MediaStream()
    callIdRef.current = null
    pendingOfferRef.current = null
    iceCursorRef.current = 0
    pendingIceRef.current = []
    remoteDescSetRef.current = false
    setLocalStream(null)
    setRemoteStream(null)
    setPeer(null)
    setCallType(null)
    setMicMuted(false)
    setCamOff(false)
    setPhase('idle')
  }

  function createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pc.onicecandidate = (event) => {
      if (!event.candidate) return
      const payload = JSON.stringify(event.candidate.toJSON())
      if (callIdRef.current == null) {
        pendingIceRef.current.push(payload)
      } else {
        sendIceFn.trigger({ callId: callIdRef.current, candidate: payload })
      }
    }
    pc.ontrack = (event) => {
      remoteStreamRef.current.addTrack(event.track)
      setRemoteStream(remoteStreamRef.current)
    }
    return pc
  }

  function flushPendingIce() {
    if (callIdRef.current == null) return
    for (const payload of pendingIceRef.current) {
      sendIceFn.trigger({ callId: callIdRef.current, candidate: payload })
    }
    pendingIceRef.current = []
  }

  async function getLocalMedia(type: CallType): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    })
    localStreamRef.current = stream
    setLocalStream(stream)
    return stream
  }

  async function startCall(peerInfo: CallPeerInfo, type: CallType) {
    if (phaseRef.current !== 'idle') return
    setErrorMessage(null)
    try {
      const stream = await getLocalMedia(type)
      const pc = createPeerConnection()
      pcRef.current = pc
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      setPeer(peerInfo)
      setCallType(type)
      setPhase('outgoing')

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const result = await startCallFn.trigger({
        calleeId: peerInfo.id,
        callType: type,
        offer: JSON.stringify(offer),
      }).result
      if (!result?.id) throw new Error('Failed to start call.')
      callIdRef.current = result.id
      flushPendingIce()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start call.')
      resetCallState()
    }
  }

  async function acceptCall() {
    if (phaseRef.current !== 'incoming' || callIdRef.current == null || !pendingOfferRef.current || !callType) return
    setErrorMessage(null)
    try {
      const stream = await getLocalMedia(callType)
      const pc = createPeerConnection()
      pcRef.current = pc
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      await pc.setRemoteDescription(JSON.parse(pendingOfferRef.current))
      remoteDescSetRef.current = true
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await answerCallFn.trigger({ callId: callIdRef.current, answer: JSON.stringify(answer) }).result
      flushPendingIce()
      setPhase('active')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to answer call.')
      const failedCallId = callIdRef.current
      resetCallState()
      if (failedCallId != null) declineCallFn.trigger({ callId: failedCallId })
    }
  }

  async function declineCall() {
    const id = callIdRef.current
    resetCallState()
    if (id != null) declineCallFn.trigger({ callId: id })
  }

  async function endCall() {
    const id = callIdRef.current
    resetCallState()
    if (id != null) endCallFn.trigger({ callId: id })
  }

  function toggleMic() {
    const stream = localStreamRef.current
    if (!stream) return
    const currentlyEnabled = stream.getAudioTracks().some((t) => t.enabled)
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !currentlyEnabled
    })
    setMicMuted(currentlyEnabled)
  }

  function toggleCam() {
    const stream = localStreamRef.current
    if (!stream) return
    const currentlyEnabled = stream.getVideoTracks().some((t) => t.enabled)
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !currentlyEnabled
    })
    setCamOff(currentlyEnabled)
  }

  // Main poll: detect incoming calls, caller-side acceptance, and remote hangups/declines.
  useEffect(() => {
    if (!profile) return
    const myProfileId = profile.id
    const interval = setInterval(() => {
      void (async () => {
        try {
          const active = await getActiveCallFn.trigger({}, { skipCache: true }).result

          if (callIdRef.current == null) {
            if (active && active.status === 'ringing' && active.callee_id === myProfileId) {
              callIdRef.current = active.id
              pendingOfferRef.current = active.offer
              setPeer({ id: active.caller_id, name: active.other_name, avatar: active.other_avatar })
              setCallType(active.call_type)
              setPhase('incoming')
            }
            return
          }

          if (active && active.id === callIdRef.current) {
            if (
              active.status === 'accepted' &&
              phaseRef.current === 'outgoing' &&
              !remoteDescSetRef.current &&
              pcRef.current
            ) {
              await pcRef.current.setRemoteDescription(JSON.parse(active.answer))
              remoteDescSetRef.current = true
              setPhase('active')
            }
          } else {
            resetCallState()
          }
        } catch {
          // ignore transient polling errors
        }
      })()
    }, ACTIVE_POLL_MS)
    return () => clearInterval(interval)
  }, [profile])

  // ICE candidate poll: only while a peer connection with a remote description exists.
  useEffect(() => {
    if (phase !== 'active') return
    const interval = setInterval(() => {
      void (async () => {
        const callId = callIdRef.current
        const pc = pcRef.current
        if (callId == null || !pc) return
        try {
          const candidates = await getIceFn.trigger(
            { callId, afterId: iceCursorRef.current },
            { skipCache: true },
          ).result
          for (const c of candidates ?? []) {
            await pc.addIceCandidate(JSON.parse(c.candidate))
            if (c.id > iceCursorRef.current) iceCursorRef.current = c.id
          }
        } catch {
          // ignore transient polling errors
        }
      })()
    }, ICE_POLL_MS)
    return () => clearInterval(interval)
  }, [phase])

  return (
    <CallContext.Provider
      value={{
        phase,
        callType,
        peer,
        localStream,
        remoteStream,
        micMuted,
        camOff,
        errorMessage,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMic,
        toggleCam,
        clearError: () => setErrorMessage(null),
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used within a CallProvider')
  return ctx
}
