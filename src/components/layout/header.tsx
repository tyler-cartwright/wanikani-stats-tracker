import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Flame, Sun, Moon, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTheme } from '@/hooks/use-theme'
import { useUserStore } from '@/stores/user-store'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/progress', label: 'Progress' },
  { path: '/accuracy', label: 'Accuracy' },
  { path: '/leeches', label: 'Leeches' },
]

export function Header() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { clearAuth, user } = useUserStore()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    if (confirm('Are you sure you want to disconnect? You\'ll need to re-enter your API token.')) {
      clearAuth()
      setShowMenu(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-paper-300 bg-paper-100 shadow-sm dark:border-ink-300 dark:bg-ink-100">
      <div className="container mx-auto px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo - Crimson Pro */}
          <Link to="/" className="flex items-center gap-3 focus-ring rounded-md px-2 py-1">
            <Flame className="w-6 h-6 text-vermillion-500" />
            <span className="text-xl font-display font-semibold text-ink-100 dark:text-paper-100">
              WK Stats
            </span>
          </Link>

          {/* Navigation Tabs - generous spacing */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative px-5 py-3 text-sm font-medium transition-smooth rounded-md focus-ring',
                    'hover:bg-paper-200 dark:hover:bg-ink-200',
                    isActive ? 'text-ink-100 dark:text-paper-100' : 'text-ink-400 dark:text-paper-300'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-0 right-0 h-0.5 bg-vermillion-500 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Actions - subtle hover states */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-md hover:bg-paper-200 dark:hover:bg-ink-200 transition-smooth focus-ring"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-ink-400 dark:text-paper-300" />
              ) : (
                <Sun className="w-5 h-5 text-ink-400 dark:text-paper-300" />
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-paper-200 dark:hover:bg-ink-200 transition-smooth focus-ring"
                aria-label="User menu"
              >
                <span className="text-sm text-ink-400 dark:text-paper-300">
                  {user?.username || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-ink-400 dark:text-paper-300" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-paper-200 dark:bg-ink-200 border border-paper-300 dark:border-ink-300 rounded-lg shadow-lg z-20">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-100 dark:text-paper-100 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
