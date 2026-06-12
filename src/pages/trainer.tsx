import { useCallback, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  queryKeys,
  useAssignments,
  useReviewStatisticRows,
  useReviewStatistics,
  useSubjects,
  useTrainerSessions,
  useUser,
} from '@/lib/api/queries'
import {
  buildCurrentLevelPool,
  buildLeechPool,
  buildRecentlyFailedPool,
  type TrainerCard,
  type TrainerPoolId,
} from '@/lib/calculations/trainer-pools'
import type { QuizSummary } from '@/lib/calculations/trainer-quiz'
import { formatLocalDate } from '@/lib/calculations/activity-capture'
import { putTrainerSession } from '@/lib/db/repositories/trainer-sessions'
import type { TrainerSessionRow } from '@/lib/db/schema'
import { useSyncStore } from '@/stores/sync-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { SessionSetup, type PoolOption } from '@/components/trainer/session-setup'
import { QuizSession } from '@/components/trainer/quiz-session'
import { SessionResults } from '@/components/trainer/session-results'

type TrainerPhase = 'setup' | 'active' | 'results'

const POOL_IDS: TrainerPoolId[] = ['leeches', 'recently-failed', 'current-level']

function parsePoolParam(value: string | null): TrainerPoolId {
  return POOL_IDS.includes(value as TrainerPoolId) ? (value as TrainerPoolId) : 'leeches'
}

export function Trainer() {
  useDocumentTitle('Trainer')
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const { data: reviewStats, isLoading: statsLoading } = useReviewStatistics()
  const { data: statRows, isLoading: rowsLoading } = useReviewStatisticRows()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { data: user } = useUser()
  const { data: sessions } = useTrainerSessions()
  const isSyncing = useSyncStore((state) => state.isSyncing)
  const includeBurnedLeeches = useSettingsStore((state) => state.includeBurnedLeeches)

  const isLoading =
    statsLoading || rowsLoading || subjectsLoading || assignmentsLoading || isSyncing

  const [phase, setPhase] = useState<TrainerPhase>('setup')
  const [selectedPool, setSelectedPool] = useState<TrainerPoolId>(() =>
    parsePoolParam(searchParams.get('pool'))
  )
  const [deck, setDeck] = useState<TrainerCard[]>([])
  const [summary, setSummary] = useState<QuizSummary | null>(null)
  const [wasAborted, setWasAborted] = useState(false)
  const startedAtRef = useRef<Date>(new Date())

  const pools: PoolOption[] = useMemo(() => {
    const hasData = !!reviewStats && !!statRows && !!subjects && !!assignments
    const leeches = hasData
      ? buildLeechPool(reviewStats, subjects, assignments, { includeBurned: includeBurnedLeeches })
      : []
    const recentlyFailed = hasData
      ? buildRecentlyFailedPool(statRows, subjects, assignments)
      : []
    const currentLevel =
      hasData && user
        ? buildCurrentLevelPool(subjects, assignments, user.level, reviewStats)
        : []

    return [
      {
        id: 'leeches' as const,
        label: 'Leeches',
        description: 'Your problem items, worst first',
        cards: leeches,
        emptyCopy: 'No leeches detected — nothing to train',
      },
      {
        id: 'recently-failed' as const,
        label: 'Recently failed',
        description: 'Items you missed within the last week',
        cards: recentlyFailed,
        emptyCopy: 'No recent misses found',
      },
      {
        id: 'current-level' as const,
        label: `Current level${user ? ` (${user.level})` : ''}`,
        description: 'Everything you have started at this level',
        cards: currentLevel,
        emptyCopy: 'No started items at this level yet',
      },
    ]
  }, [reviewStats, statRows, subjects, assignments, user, includeBurnedLeeches])

  const persistSession = useCallback(
    async (sessionSummary: QuizSummary, completed: boolean) => {
      const now = new Date()
      const row: TrainerSessionRow = {
        id: crypto.randomUUID(),
        date: formatLocalDate(startedAtRef.current),
        startedAt: startedAtRef.current.toISOString(),
        completedAt: completed ? now.toISOString() : null,
        mode: 'flashcards',
        pool: selectedPool,
        totalCards: sessionSummary.totalCards,
        firstTryCorrect: sessionSummary.firstTryCorrect,
        cards: sessionSummary.cards,
        updatedAt: now.toISOString(),
      }
      try {
        await putTrainerSession(row)
        await queryClient.invalidateQueries({ queryKey: queryKeys.trainerSessions })
      } catch (error) {
        // A failed write must never block the results screen
        console.error('[TRAINER] Failed to save session:', error)
      }
    },
    [queryClient, selectedPool]
  )

  const startSession = useCallback((cards: TrainerCard[]) => {
    startedAtRef.current = new Date()
    setDeck(cards)
    setSummary(null)
    setWasAborted(false)
    setPhase('active')
  }, [])

  const handleStart = () => {
    const pool = pools.find((p) => p.id === selectedPool)
    if (pool && pool.cards.length > 0) startSession(pool.cards)
  }

  const handleComplete = useCallback(
    (sessionSummary: QuizSummary) => {
      void persistSession(sessionSummary, true)
      setSummary(sessionSummary)
      setWasAborted(false)
      setPhase('results')
    },
    [persistSession]
  )

  const handleQuit = useCallback(
    (sessionSummary: QuizSummary) => {
      if (sessionSummary.gradedCards === 0) {
        // Nothing graded: nothing worth recording or summarizing
        setPhase('setup')
        return
      }
      void persistSession(sessionSummary, false)
      setSummary(sessionSummary)
      setWasAborted(true)
      setPhase('results')
    },
    [persistSession]
  )

  const completedSessions = sessions?.filter((s) => s.completedAt !== null).length ?? 0

  return (
    <div className="space-y-8">
      {phase === 'setup' && (
        <SessionSetup
          pools={pools}
          selectedPool={selectedPool}
          onSelectPool={setSelectedPool}
          onStart={handleStart}
          isLoading={isLoading}
          completedSessions={completedSessions}
        />
      )}

      {phase === 'active' && (
        <QuizSession
          // Remount per deck so the reducer state can never leak across sessions
          key={startedAtRef.current.getTime()}
          cards={deck}
          onComplete={handleComplete}
          onQuit={handleQuit}
        />
      )}

      {phase === 'results' && summary && (
        <SessionResults
          summary={summary}
          deck={deck}
          wasAborted={wasAborted}
          onRetryNeedsWork={startSession}
          onNewSession={() => setPhase('setup')}
        />
      )}
    </div>
  )
}
