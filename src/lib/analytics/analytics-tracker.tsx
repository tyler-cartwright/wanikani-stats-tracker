// Renders nothing. Mounted once in the authenticated tree (inside the router,
// outside InitialSync) to send the per-load `open` event and a `view` per
// route change. See docs/analytics-plan.md.

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSyncStatus, useUser } from '@/lib/api/queries'
import { pageFromPath } from './events'
import { identify, track, trackOpen } from './track'

export function AnalyticsTracker() {
  const { data: user } = useUser()
  const { data: syncStatus } = useSyncStatus()
  const location = useLocation()
  const [uidc, setUidc] = useState<string | null>(null)

  // Whether IndexedDB already held data when the app booted (returning user
  // with a warm cache) — captured from the first resolved status, before the
  // initial sync flips it.
  const cachedAtBoot = useRef<boolean | null>(null)
  if (cachedAtBoot.current === null && syncStatus) {
    cachedAtBoot.current = syncStatus.hasData
  }

  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    identify(userId)
      .then((digest) => {
        if (!cancelled) setUidc(digest)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (uidc && cachedAtBoot.current !== null) trackOpen(cachedAtBoot.current)
  }, [uidc, syncStatus])

  useEffect(() => {
    if (!uidc) return
    const page = pageFromPath(location.pathname)
    if (page) track({ e: 'view', uidc, page })
  }, [uidc, location.pathname])

  return null
}
