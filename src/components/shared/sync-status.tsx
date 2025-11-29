// src/components/shared/sync-status.tsx
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { cn } from '@/lib/utils/cn'

interface SyncStatusProps {
  className?: string
  showButton?: boolean
}

export function SyncStatus({ className, showButton = true }: SyncStatusProps) {
  const { sync, isSyncing, lastSyncAt, error } = useSync()

  return (
    <div className={cn('flex items-center gap-3 text-sm', className)}>
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-vermillion-500" />
          <span className="text-ink-400 dark:text-paper-300">Syncing...</span>
        </>
      ) : error ? (
        <>
          <AlertCircle className="w-4 h-4 text-vermillion-500" />
          <span className="text-vermillion-500">Sync failed</span>
        </>
      ) : lastSyncAt ? (
        <>
          <CheckCircle className="w-4 h-4 text-patina-500" />
          <span className="text-ink-400 dark:text-paper-300">
            Synced {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
          </span>
        </>
      ) : (
        <span className="text-ink-400 dark:text-paper-300">Not synced</span>
      )}

      {showButton && !isSyncing && (
        <button
          onClick={() => sync()}
          className="p-1.5 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth"
          title="Sync now"
        >
          <RefreshCw className="w-4 h-4 text-ink-400 dark:text-paper-300" />
        </button>
      )}
    </div>
  )
}
