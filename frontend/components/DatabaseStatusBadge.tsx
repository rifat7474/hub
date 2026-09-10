import { useEffect, useState } from 'react'
import { Database, CheckCircle2, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react'
import { subscribeToConnectionStatus, testDatabaseConnection, type ConnectionStatus } from '../lib/firebase'
import { toast } from '../lib/shadcn/sonner'

export function DatabaseStatusBadge() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    checking: true,
    error: null,
    databaseId: '',
    projectId: '',
  })
  const [isOpen, setIsOpen] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const unsub = subscribeToConnectionStatus((s) => setStatus(s))
    return unsub
  }, [])

  async function handleRecheck() {
    setTesting(true)
    const success = await testDatabaseConnection()
    setTesting(false)
    if (success) {
      toast.success('Firebase database is connected properly!')
    } else {
      toast.error('Could not verify Firebase connection.')
    }
  }

  return (
    <>
      <button
        id="firebase-status-badge"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border/80 bg-background/60 hover:bg-accent/60 transition-colors shadow-sm"
        title="Check database connection"
      >
        <span className="relative flex h-2 w-2">
          {status.connected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : status.checking ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          )}
        </span>
        <Database className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="hidden sm:inline text-muted-foreground font-mono">
          {status.connected ? 'Firestore: Online' : status.checking ? 'Connecting...' : 'Offline'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl text-card-foreground space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">Firebase Database Status</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Connection Status</span>
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  {status.connected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected Properly
                    </>
                  ) : status.checking ? (
                    'Checking...'
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      Disconnected
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-mono">Google Cloud Firestore</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Project ID</span>
                <span className="font-mono truncate max-w-[170px]" title={status.projectId}>
                  {status.projectId}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Database ID</span>
                <span className="font-mono truncate max-w-[170px]" title={status.databaseId}>
                  {status.databaseId}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Authentication & Rules</span>
                <span className="flex items-center gap-1 text-primary">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                id="btn-recheck-db"
                onClick={handleRecheck}
                disabled={testing}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing...' : 'Verify Database Connection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
