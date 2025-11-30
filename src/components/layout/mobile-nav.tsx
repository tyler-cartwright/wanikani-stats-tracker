import { Link, useLocation } from 'react-router-dom'
import { Flame, Sun, Moon, Settings, LogOut, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTheme } from '@/hooks/use-theme'
import { useUserStore } from '@/stores/user-store'
import { JapaneseLabel } from '@/components/shared/japanese-label'
import { SyncStatus } from '@/components/shared/sync-status'
import { useConfirm } from '@/hooks/use-confirm'
import { useEffect } from 'react'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { path: '/', label: 'Dashboard', japanese: '概要' },
  { path: '/progress', label: 'Progress', japanese: '進捗' },
  { path: '/accuracy', label: 'Accuracy', japanese: '精度' },
  { path: '/leeches', label: 'Leeches', japanese: '難点' },
]

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { clearAuth } = useUserStore()
  const { confirm, ConfirmDialog } = useConfirm()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <>
      {/* Overlay - warm charcoal tint */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-100/50 dark:bg-paper-100/20 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer - warm paper in light, warm charcoal in dark */}
      <aside
        className="fixed top-0 left-0 z-50 h-full w-[280px] bg-paper-200 dark:bg-ink-200 shadow-xl border-r border-paper-300 dark:border-ink-300"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header - Crimson Pro logo */}
          <div className="flex items-center justify-between p-6 border-b border-paper-300 dark:border-ink-300">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-vermillion-500" />
              <span className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
                WaniTrack
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-ink-400 dark:text-paper-300" />
            </button>
          </div>

          {/* Navigation - generous spacing */}
          <nav className="flex-1 p-6 space-y-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'block px-5 py-4 rounded-md transition-smooth focus-ring',
                    'hover:bg-paper-300 dark:hover:bg-ink-300',
                    isActive
                      ? 'bg-paper-300 dark:bg-ink-300 text-ink-100 dark:text-paper-100 font-medium'
                      : 'text-ink-400 dark:text-paper-300'
                  )}
                >
                  <div className="text-base">{item.label}</div>
                  <JapaneseLabel text={item.japanese} />
                </Link>
              )
            })}
          </nav>

          {/* Actions - warm paper background */}
          <div className="p-6 border-t border-paper-300 dark:border-ink-300 space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring text-ink-400 dark:text-paper-300"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-5 h-5" />
                  <span className="text-sm font-medium">Dark mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5" />
                  <span className="text-sm font-medium">Light mode</span>
                </>
              )}
            </button>
            <Link
              to="/settings"
              className="flex items-center gap-3 w-full px-5 py-4 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring text-ink-400 dark:text-paper-300"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Disconnect Account?',
                  message: "You'll need to re-enter your API token to reconnect.",
                  confirmText: 'Disconnect',
                  cancelText: 'Cancel',
                  variant: 'warning',
                })

                if (confirmed) {
                  await clearAuth()
                  onClose()
                }
              }}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring text-ink-400 dark:text-paper-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Disconnect</span>
            </button>
          </div>

          {/* Sync Status */}
          <div className="px-5 py-3 border-t border-paper-300 dark:border-ink-300">
            <SyncStatus showButton />
          </div>
        </div>
      </aside>
      {ConfirmDialog}
    </>
  )
}
