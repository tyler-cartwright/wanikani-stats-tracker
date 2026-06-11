// src/components/shared/sync-status.tsx
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useSync } from '@/hooks/use-sync'
import { cn } from '@/lib/utils/cn'

interface SyncStatusProps {
  className?: string
  showButton?: boolean
  // Hide the routine status text below 2xl (the icon and button stay) — the
  // relative-time label is wide and variable ("Synced less than a minute
  // ago") and squeezes the header nav on laptop widths. "Sync failed" is
  // never collapsed: errors must stay visible.
  collapseLabel?: boolean
}

export function SyncStatus({ className, showButton = true, collapseLabel = false }: SyncStatusProps) {
  const { sync, isSyncing, lastSyncAt, error } = useSync()
  const labelClass = cn(
    'text-ink-400 dark:text-paper-300',
    collapseLabel && 'hidden 2xl:inline'
  )

  // With the label collapsed, hovering the icon still reveals the status
  const hoverTitle =
    collapseLabel && lastSyncAt && !isSyncing && !error
      ? `Synced ${formatDistanceToNow(lastSyncAt, { addSuffix: true })}`
      : undefined

  return (
    <div className={cn('flex items-center gap-3 text-sm', className)} title={hoverTitle}>
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-vermillion-500" />
          <span className={labelClass}>Syncing...</span>
        </>
      ) : error ? (
        <>
          <AlertCircle className="w-4 h-4 text-vermillion-500" />
          <span className="text-vermillion-500">Sync failed</span>
        </>
      ) : lastSyncAt ? (
        <>
          <CheckCircle className="w-4 h-4 text-patina-500" />
          <span className={labelClass}>
            Synced {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
          </span>
        </>
      ) : (
        <span className={labelClass}>Not synced</span>
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
