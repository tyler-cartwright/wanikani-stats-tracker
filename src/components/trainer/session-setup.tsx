import type { TrainerCard, TrainerPoolId } from '@/lib/calculations/trainer-pools'

export interface PoolOption {
  id: TrainerPoolId
  label: string
  description: string
  cards: TrainerCard[]
  emptyCopy: string
}

interface SessionSetupProps {
  pools: PoolOption[]
  selectedPool: TrainerPoolId
  onSelectPool: (id: TrainerPoolId) => void
  onStart: () => void
  isLoading: boolean
  completedSessions: number
}

export function SessionSetup({
  pools,
  selectedPool,
  onSelectPool,
  onStart,
  isLoading,
  completedSessions,
}: SessionSetupProps) {
  if (isLoading) {
    return (
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <div className="h-6 w-48 bg-paper-300 dark:bg-ink-300 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-paper-300 dark:bg-ink-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const selected = pools.find((p) => p.id === selectedPool)
  const canStart = !!selected && selected.cards.length > 0

  return (
    <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
          Start a session
        </h2>
        <p className="text-sm text-ink-400 dark:text-paper-300 mt-1">
          Self-graded flashcards — purely local, your WaniKani reviews are never touched.
        </p>
      </div>

      {/* Pool picker */}
      <div className="space-y-3" role="radiogroup" aria-label="Item pool">
        {pools.map((pool) => {
          const isEmpty = pool.cards.length === 0
          const isSelected = pool.id === selectedPool
          return (
            <button
              key={pool.id}
              role="radio"
              aria-checked={isSelected}
              disabled={isEmpty}
              onClick={() => onSelectPool(pool.id)}
              className={`w-full text-left p-4 rounded-lg border transition-smooth focus-ring ${
                isSelected
                  ? 'border-vermillion-500 dark:border-vermillion-400 bg-paper-300/50 dark:bg-ink-300/50'
                  : 'border-paper-300 dark:border-ink-300 hover:bg-paper-300/50 dark:hover:bg-ink-300/50'
              } ${isEmpty ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-ink-100 dark:text-paper-100">{pool.label}</div>
                  <div className="text-sm text-ink-400 dark:text-paper-300 mt-0.5">
                    {isEmpty ? pool.emptyCopy : pool.description}
                  </div>
                </div>
                <span
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${
                    isSelected && !isEmpty
                      ? 'bg-vermillion-500 text-paper-100 dark:text-ink-100'
                      : 'bg-paper-300 dark:bg-ink-300 text-ink-400 dark:text-paper-300'
                  }`}
                >
                  {pool.cards.length}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        {completedSessions > 0 ? (
          <span className="text-sm text-ink-400 dark:text-paper-300">
            {completedSessions} {completedSessions === 1 ? 'session' : 'sessions'} completed
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={onStart}
          disabled={!canStart}
          className="px-6 py-3 rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 font-medium transition-smooth focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start training
        </button>
      </div>
    </div>
  )
}
