# Performance Optimization Recommendations

## Critical Issues (40s load time)

### 1. Parallel API Syncing (High Impact)
**Current:** Sequential syncing with 1s rate limit between requests
**Fix:** Fetch assignments, review stats, and level progressions in parallel after subjects complete

```typescript
// In sync-manager.ts - after subjects sync
const [assignmentsResult, statsResult, progressionsResult] = await Promise.all([
  syncAssignments(token, onProgress),
  syncReviewStatistics(token, onProgress),
  syncLevelProgressions(token, onProgress)
]);
```

**Impact:** Reduce sync time by ~60% (from 40s to ~15-20s)

### 2. Optimize IndexedDB Queries (High Impact)
**Current:** `refetchOnMount: 'always'` and `staleTime: 0` causes full data reload on every page
**Fix:** Increase staleTime and remove unnecessary refetches

```typescript
// In queries.ts
export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: getCachedSubjects,
    enabled: !!token && !isSyncing,
    staleTime: 5 * 60 * 1000, // 5 minutes instead of 0
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false, // Don't refetch on every mount
    retry: 1,
  })
}
```

**Impact:** Eliminate 2-5s delay on page navigation

### 3. Add Calculation Memoization (Medium Impact)
**Current:** Heavy calculations run on every render
**Fix:** Use React Query to cache calculation results

```typescript
// New file: src/lib/api/calculation-queries.ts
export function useLeechDetection(threshold) {
  const { data: reviewStats } = useReviewStatistics()
  const { data: subjects } = useSubjects()
  const { data: assignments } = useAssignments()
  
  return useQuery({
    queryKey: ['leeches', threshold],
    queryFn: () => detectLeeches(reviewStats, subjects, assignments, threshold),
    enabled: !!reviewStats && !!subjects && !!assignments,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
```

**Impact:** Reduce calculation time from 3-5s to <100ms on subsequent loads

### 4. Implement Progressive Loading (Medium Impact)
**Current:** App waits for all data before showing anything
**Fix:** Show dashboard immediately with cached data, sync in background

```typescript
// In initial-sync.tsx - already partially implemented
// Enhance to show skeleton states while calculations run
```

**Impact:** Perceived load time reduced to <1s for returning users

### 5. Optimize Rate Limiter (Low Impact)
**Current:** Fixed 1s delay between all requests
**Fix:** Use token bucket algorithm to burst initial requests

```typescript
// In client.ts
class RateLimiter {
  private tokens = 5 // Allow 5 burst requests
  private maxTokens = 5
  private refillRate = 1000 // 1 token per second
  
  async waitIfNeeded(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens--
      return
    }
    await new Promise(resolve => setTimeout(resolve, this.refillRate))
  }
}
```

**Impact:** Reduce initial sync time by 3-5s

### 6. Add IndexedDB Indexes (Low Impact)
**Current:** Full table scans for filtered queries
**Fix:** Already has indexes, but could add composite indexes

```typescript
// In database.ts - add composite indexes
assignmentsStore.createIndex('srs_hidden', ['srs_stage', 'hidden'])
```

**Impact:** Reduce query time by 10-20%

## Implementation Priority

1. **Parallel API Syncing** - Biggest impact, easiest to implement
2. **Optimize Query Stale Times** - Quick win, significant impact
3. **Calculation Memoization** - Medium effort, good impact
4. **Progressive Loading** - Better UX, already partially done
5. **Rate Limiter Optimization** - Small improvement
6. **IndexedDB Indexes** - Marginal gains

## Expected Results

- Initial sync: 40s → 15-20s (50% improvement)
- Subsequent loads: 5-10s → <1s (90% improvement)
- Page navigation: 2-5s → <100ms (95% improvement)
