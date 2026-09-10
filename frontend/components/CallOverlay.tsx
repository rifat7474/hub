import { useEffect, useRef } from 'react'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react'
import { useCall } from '../hooks/useCallManager'
import { Button } from '../lib/shadcn/button'
import { UserAvatar } from './UserAvatar'
import { cn } from '../lib/shadcn/utils'

function VideoEl({ stream, muted, className }: { stream: MediaStream | null; muted?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  if (!stream) return null
  return <video ref={ref} autoPlay playsInline muted={muted ?? false} className={className} />
}

export function CallOverlay() {
  const call = useCall()
  const { phase, callType, peer, localStream, remoteStream, micMuted, camOff, errorMessage } = call

  if (errorMessage) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border bg-card text-card-foreground p-density-md shadow-retool-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm">{errorMessage}</p>
          <button onClick={call.clearError} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'idle') return null

  const isIncoming = phase === 'incoming'
  const isOutgoing = phase === 'outgoing'
  const isVideo = callType === 'video'
  const isPulsing = isIncoming || isOutgoing

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center gap-density-xl p-density-xl animate-in fade-in duration-200">
      {peer && (
        <div className="flex flex-col items-center gap-density-md">
          <div className="relative">
            {isPulsing && (
              <>
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <span className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse" />
              </>
            )}
            <UserAvatar name={peer.name} avatarUrl={peer.avatar} size="xl" className="relative shadow-retool-lg" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground">{peer.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isIncoming && `Incoming ${callType} call...`}
              {isOutgoing && `Calling (${callType})...`}
              {phase === 'active' && (isVideo ? 'Video call in progress' : 'Audio call in progress')}
            </p>
          </div>
        </div>
      )}

      {phase === 'active' && isVideo && (
        <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden bg-black shadow-retool-lg">
          <VideoEl stream={remoteStream} className="w-full h-full object-cover" />
          <div className="absolute bottom-3 right-3 w-32 aspect-video rounded-xl overflow-hidden border-2 border-background shadow-retool-lg">
            <VideoEl stream={localStream} muted className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-density-md">
        {isIncoming && (
          <>
            <Button
              size="lg"
              className="rounded-full h-14 w-14 bg-success text-success-foreground hover:bg-success/90 shadow-retool-lg"
              onClick={() => call.acceptCall()}
              aria-label="Accept call"
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full h-14 w-14 shadow-retool-lg"
              onClick={() => call.declineCall()}
              aria-label="Decline call"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </>
        )}

        {(isOutgoing || phase === 'active') && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className={cn('rounded-full h-12 w-12', micMuted && 'bg-destructive/10 text-destructive')}
              onClick={() => call.toggleMic()}
              aria-label={micMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            {isVideo && (
              <Button
                size="icon"
                variant="secondary"
                className={cn('rounded-full h-12 w-12', camOff && 'bg-destructive/10 text-destructive')}
                onClick={() => call.toggleCam()}
                aria-label={camOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {camOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>
            )}
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full h-14 w-14 shadow-retool-lg"
              onClick={() => call.endCall()}
              aria-label="End call"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
