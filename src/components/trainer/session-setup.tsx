import type { TrainerCard, TrainerMode, TrainerPoolId } from '@/lib/calculations/trainer-pools'
import { useSettingsStore } from '@/stores/settings-store'

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
  mode: TrainerMode
  onSelectMode: (mode: TrainerMode) => void
  confusionCards: TrainerCard[]
  onStart: () => void
  isLoading: boolean
  completedSessions: number
}

export function SessionSetup({
  pools,
  selectedPool,
  onSelectPool,
  mode,
  onSelectMode,
  confusionCards,
  onStart,
  isLoading,
  completedSessions,
}: SessionSetupProps) {
  const { trainerAutoplayAudio, setTrainerAutoplayAudio } = useSettingsStore()

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
  const canStart =
    mode === 'confusion' ? confusionCards.length > 0 : !!selected && selected.cards.length > 0

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

      {/* Mode picker */}
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Training mode">
        {(
          [
            {
              id: 'flashcards' as const,
              label: 'Flashcards',
              description: 'Quiz a pool of items',
            },
            {
              id: 'confusion' as const,
              label: 'Confusion pairs',
              description: 'Drill lookalike leeches against each other',
            },
          ] satisfies Array<{ id: TrainerMode; label: string; description: string }>
        ).map((option) => {
          const isSelected = mode === option.id
          return (
            <button
              key={option.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectMode(option.id)}
              className={`text-left p-4 rounded-lg border transition-smooth focus-ring cursor-pointer ${
                isSelected
                  ? 'border-vermillion-500 dark:border-vermillion-400 bg-paper-300/50 dark:bg-ink-300/50'
                  : 'border-paper-300 dark:border-ink-300 hover:bg-paper-300/50 dark:hover:bg-ink-300/50'
              }`}
            >
              <div className="font-medium text-ink-100 dark:text-paper-100">{option.label}</div>
              <div className="text-sm text-ink-400 dark:text-paper-300 mt-0.5">
                {option.description}
              </div>
            </button>
          )
        })}
      </div>

      {/* Confusion deck summary */}
      {mode === 'confusion' && (
        <div className="p-4 rounded-lg border border-paper-300 dark:border-ink-300">
          {confusionCards.length > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-ink-400 dark:text-paper-300">
                Visually-similar leeches drawn from your confusion pairs — each card shows its
                lookalike on reveal
              </div>
              <span className="flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold bg-vermillion-500 text-paper-100 dark:text-ink-100">
                {confusionCards.length}
              </span>
            </div>
          ) : (
            <div className="text-sm text-ink-400 dark:text-paper-300">
              No confusable leech pairs found — this mode needs at least two leeches that look
              alike
            </div>
          )}
        </div>
      )}

      {/* Pool picker */}
      {mode === 'flashcards' && (
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
      )}

      {/* Autoplay audio */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
            Play audio on reveal
          </div>
          <div className="text-sm text-ink-400 dark:text-paper-300">
            Vocabulary pronunciation plays automatically when a card flips
          </div>
        </div>
        <button
          onClick={() => setTrainerAutoplayAudio(!trainerAutoplayAudio)}
          role="switch"
          aria-checked={trainerAutoplayAudio}
          aria-label="Play audio on reveal"
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            trainerAutoplayAudio ? 'bg-vermillion-500' : 'bg-paper-300 dark:bg-ink-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-paper-100 dark:bg-ink-100 transition-transform ${
              trainerAutoplayAudio ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
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
