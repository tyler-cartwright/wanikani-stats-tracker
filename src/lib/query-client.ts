// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

// Configure TanStack Query. Lives outside App.tsx so non-component code
// (e.g. the user store's logout) can clear it without importing the app tree.
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
