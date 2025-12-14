import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserStore } from './stores/user-store'
import { AppShell } from './components/layout/app-shell'
import { ErrorBoundary } from './components/shared/error-boundary'
import { InitialSync } from './components/shared/initial-sync'
import { Loader2 } from 'lucide-react'
import { lazyWithRetry } from './lib/utils/lazy-with-retry'

// Lazy load pages with automatic chunk error retry
const Dashboard = lazyWithRetry(() => import('./pages/dashboard').then(m => ({ default: m.Dashboard })))
const Progress = lazyWithRetry(() => import('./pages/progress').then(m => ({ default: m.Progress })))
const Accuracy = lazyWithRetry(() => import('./pages/accuracy').then(m => ({ default: m.Accuracy })))
const Leeches = lazyWithRetry(() => import('./pages/leeches').then(m => ({ default: m.Leeches })))
const Kanji = lazyWithRetry(() => import('./pages/kanji').then(m => ({ default: m.Kanji })))
const Readiness = lazyWithRetry(() => import('./pages/readiness').then(m => ({ default: m.Readiness })))
const Settings = lazyWithRetry(() => import('./pages/settings').then(m => ({ default: m.Settings })))
const Setup = lazyWithRetry(() => import('./pages/setup').then(m => ({ default: m.Setup })))

// Configure TanStack Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute default
      gcTime: 300000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      // Disable structural sharing to ensure fresh object references
      // This fixes component memoization issues where useMemo doesn't recompute
      structuralSharing: false,
    },
  },
})

function AppContent() {
  const token = useUserStore((state) => state.token)
  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const isAuthenticated = !!token

  // Wait for hydration
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-ink-400 dark:text-paper-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Loading fallback
  const loadingFallback = (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-100 flex items-center justify-center">
      <div className="flex items-center gap-3 text-ink-400 dark:text-paper-300">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  )

  // Show setup if not authenticated
  if (!isAuthenticated) {
    return (
      <Suspense fallback={loadingFallback}>
        <Setup />
      </Suspense>
    )
  }

  // Show main app if authenticated
  return (
    <InitialSync>
      <AppShell>
        <Suspense fallback={loadingFallback}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/accuracy" element={<Accuracy />} />
            <Route path="/leeches" element={<Leeches />} />
            <Route path="/kanji" element={<Kanji />} />
            <Route path="/readiness" element={<Readiness />} />
            <Route path="/jlpt" element={<Navigate to="/readiness" replace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </InitialSync>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
