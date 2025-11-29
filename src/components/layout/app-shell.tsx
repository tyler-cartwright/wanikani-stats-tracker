import { ReactNode, useState } from 'react'
import { Header } from './header'
import { MobileNav } from './mobile-nav'
import { Footer } from './footer'
import { OfflineIndicator } from '@/components/shared/offline-indicator'
import { InstallPrompt } from '@/components/shared/install-prompt'
import { useMobile } from '@/hooks/use-mobile'
import { Menu } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const isMobile = useMobile()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-100">
      {isMobile ? (
        <>
          {/* Mobile Header with Hamburger */}
          <header className="sticky top-0 z-40 w-full border-b border-paper-300 bg-paper-100 shadow-sm dark:border-ink-300 dark:bg-ink-100">
            <div className="flex h-16 items-center justify-between px-6">
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="p-2 rounded-md hover:bg-paper-200 dark:hover:bg-ink-200 transition-smooth focus-ring"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-ink-400 dark:text-paper-300" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
                  WaniTrack
                </span>
              </div>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </header>

          {/* Mobile Side Drawer */}
          <MobileNav
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
          />
        </>
      ) : (
        /* Desktop Header */
        <Header />
      )}

      {/* Page Content - generous padding, max-width for readability */}
      <main className="container mx-auto px-8 py-12 max-w-6xl min-h-[calc(100vh-200px)]">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  )
}
