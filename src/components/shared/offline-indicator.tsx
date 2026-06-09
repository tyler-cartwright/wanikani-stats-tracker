import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100 px-4 py-2 rounded-lg shadow-lg border border-ink-200 dark:border-paper-200 flex items-center gap-2 text-sm">
        <WifiOff className="w-4 h-4" />
        <span>Offline — showing cached data</span>
      </div>
    </div>
  )
}
