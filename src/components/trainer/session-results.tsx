import { useState } from 'react'
import type { TrainerCard } from '@/lib/calculations/trainer-pools'
import { toDetailItem } from '@/lib/calculations/trainer-pools'
import type { QuizSummary } from '@/lib/calculations/trainer-quiz'
import { Modal } from '@/components/shared/modal'
import { ItemDetailContent } from '@/components/shared/item-detail-content'

interface SessionResultsProps {
  summary: QuizSummary
  // The session's deck, for resolving graded subjectIds back to cards
  deck: TrainerCard[]
  wasAborted: boolean
  onRetryNeedsWork: (cards: TrainerCard[]) => void
  onNewSession: () => void
}

export function SessionResults({
  summary,
  deck,
  wasAborted,
  onRetryNeedsWork,
  onNewSession,
}: SessionResultsProps) {
  const [selectedCard, setSelectedCard] = useState<TrainerCard | null>(null)

  const deckById = new Map(deck.map((card) => [card.subjectId, card]))
  const needsWorkCards = summary.cards
    .filter((result) => !result.firstTryCorrect)
    .map((result) => deckById.get(result.subjectId))
    .filter((card): card is TrainerCard => !!card)

  const firstTryPercent =
    summary.gradedCards > 0
      ? Math.round((summary.firstTryCorrect / summary.gradedCards) * 100)
      : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
        <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-1">
          {wasAborted ? 'Session ended early' : 'Session complete'}
        </h2>
        {wasAborted && (
          <p className="text-sm text-ink-400 dark:text-paper-300 mb-4">
            {summary.gradedCards} of {summary.totalCards} cards were graded before you ended it.
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-lg bg-paper-300/50 dark:bg-ink-300/50">
            <div className="text-3xl font-display font-semibold text-ink-100 dark:text-paper-100">
              {summary.gradedCards}
            </div>
            <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">Cards graded</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-paper-300/50 dark:bg-ink-300/50">
            <div className="text-3xl font-display font-semibold text-ink-100 dark:text-paper-100">
              {summary.firstTryCorrect}
            </div>
            <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">Got it first try</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-paper-300/50 dark:bg-ink-300/50">
            <div className="text-3xl font-display font-semibold text-vermillion-500 dark:text-vermillion-400">
              {firstTryPercent}%
            </div>
            <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">First-try accuracy</div>
          </div>
        </div>
      </div>

      {/* Needs-work list */}
      {needsWorkCards.length > 0 && (
        <div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
          <h3 className="text-base font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
            Needed work ({needsWorkCards.length})
          </h3>
          <div className="space-y-2">
            {needsWorkCards.map((card) => (
              <div
                key={card.subjectId}
                onClick={() => setSelectedCard(card)}
                className="flex items-baseline gap-3 p-3 rounded-lg border border-paper-300 dark:border-ink-300 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth cursor-pointer"
              >
                <span className="text-xl font-japanese text-ink-100 dark:text-paper-100">
                  {card.character}
                </span>
                <span className="text-sm text-ink-300 dark:text-paper-300">{card.primaryMeaning}</span>
                {card.readings.primary && (
                  <span className="text-sm font-japanese text-ink-400 dark:text-paper-300">
                    {card.readings.primary}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {needsWorkCards.length > 0 && (
          <button
            onClick={() => onRetryNeedsWork(needsWorkCards)}
            className="flex-1 px-4 py-3 rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 font-medium transition-smooth focus-ring"
          >
            Train needs-work again
          </button>
        )}
        <button
          onClick={onNewSession}
          className="flex-1 px-4 py-3 rounded-md border border-paper-300 dark:border-ink-300 hover:bg-paper-300 dark:hover:bg-ink-300 text-ink-100 dark:text-paper-100 font-medium transition-smooth focus-ring"
        >
          New session
        </button>
      </div>

      {/* Item drilldown — same pattern as the Leeches priority list */}
      <Modal isOpen={selectedCard !== null} onClose={() => setSelectedCard(null)} size="lg">
        {selectedCard && (
          <div className="p-6">
            <ItemDetailContent item={toDetailItem(selectedCard)} />
            <button
              onClick={() => setSelectedCard(null)}
              className="w-full mt-4 px-4 py-2 text-sm font-medium rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 transition-smooth focus-ring"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
