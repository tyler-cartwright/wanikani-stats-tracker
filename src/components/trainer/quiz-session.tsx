import { useCallback, useEffect, useReducer, useRef } from 'react'
import { X } from 'lucide-react'
import type { TrainerCard } from '@/lib/calculations/trainer-pools'
import {
  createQuiz,
  currentCard,
  quizReducer,
  summarizeQuiz,
  type QuizSummary,
} from '@/lib/calculations/trainer-quiz'
import { QuizCard } from './quiz-card'
import { useAudioPlayer } from './audio-button'
import { useConfirm } from '@/hooks/use-confirm'
import { useSettingsStore } from '@/stores/settings-store'

interface QuizSessionProps {
  cards: TrainerCard[]
  onComplete: (summary: QuizSummary) => void
  // Fired on a confirmed quit; the summary covers the cards graded so far
  onQuit: (summary: QuizSummary) => void
}

export function QuizSession({ cards, onComplete, onQuit }: QuizSessionProps) {
  const [state, dispatch] = useReducer(quizReducer, cards, createQuiz)
  const { confirm, ConfirmDialog } = useConfirm()
  const card = currentCard(state)
  const trainerAutoplayAudio = useSettingsStore((s) => s.trainerAutoplayAudio)
  const { play: playAudio, failedUrl: failedAudioUrl } = useAudioPlayer()

  // Autoplay must fire synchronously inside the reveal's click/keydown so
  // browser autoplay policies see a user gesture
  const handleReveal = useCallback(() => {
    if (state.phase !== 'front') return
    dispatch({ type: 'reveal' })
    const revealing = currentCard(state)
    if (trainerAutoplayAudio && revealing?.audioUrl) playAudio(revealing.audioUrl)
  }, [state, trainerAutoplayAudio, playAudio])

  // Completion is a state, not an event, so report it from an effect; the
  // ref guards StrictMode's double-invoke
  const completedRef = useRef(false)
  useEffect(() => {
    if (state.phase === 'complete' && !completedRef.current) {
      completedRef.current = true
      onComplete(summarizeQuiz(state))
    }
  }, [state, onComplete])

  // Keyboard shortcuts: Space/Enter reveal, 1 = Got it, 2 = Needs work
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleReveal()
      } else if (e.key === '1') {
        dispatch({ type: 'grade', grade: 'got-it' })
      } else if (e.key === '2') {
        dispatch({ type: 'grade', grade: 'needs-work' })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleReveal])

  const handleQuit = async () => {
    const graded = Object.keys(state.results).length
    const confirmed = await confirm({
      title: 'End session?',
      message:
        graded > 0
          ? `Your ${graded} graded ${graded === 1 ? 'card' : 'cards'} will be saved; the rest of the deck is discarded.`
          : 'Nothing has been graded yet, so nothing will be saved.',
      confirmText: 'End session',
      cancelText: 'Keep going',
      variant: 'warning',
    })
    if (confirmed) {
      onQuit(summarizeQuiz(state))
    }
  }

  if (!card) return null

  const cleared = state.totalCards - state.queue.length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 rounded-full bg-paper-300 dark:bg-ink-300 overflow-hidden">
          <div
            className="h-full bg-vermillion-500 dark:bg-vermillion-400 rounded-full transition-all duration-300"
            style={{ width: `${(cleared / state.totalCards) * 100}%` }}
          />
        </div>
        <span className="text-sm text-ink-400 dark:text-paper-300 whitespace-nowrap">
          {cleared} / {state.totalCards} cleared
        </span>
        <button
          onClick={handleQuit}
          className="p-2 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
          aria-label="End session"
        >
          <X className="w-5 h-5 text-ink-400 dark:text-paper-300" />
        </button>
      </div>

      <QuizCard
        card={card}
        phase={state.phase as 'front' | 'revealed'}
        onReveal={handleReveal}
        onPlayAudio={playAudio}
        failedAudioUrl={failedAudioUrl}
      />

      {/* Grade buttons */}
      {state.phase === 'revealed' && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => dispatch({ type: 'grade', grade: 'needs-work' })}
            className="px-4 py-4 rounded-lg border border-vermillion-500/40 text-vermillion-500 dark:text-vermillion-400 hover:bg-vermillion-500/10 font-medium transition-smooth focus-ring"
          >
            Needs work
            <span className="hidden sm:inline text-xs opacity-60 ml-2">2</span>
          </button>
          <button
            onClick={() => dispatch({ type: 'grade', grade: 'got-it' })}
            className="px-4 py-4 rounded-lg bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 font-medium transition-smooth focus-ring"
          >
            Got it
            <span className="hidden sm:inline text-xs opacity-60 ml-2">1</span>
          </button>
        </div>
      )}

      {ConfirmDialog}
    </div>
  )
}
