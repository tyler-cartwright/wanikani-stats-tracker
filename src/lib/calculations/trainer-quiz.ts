// Trainer quiz state machine. A pure reducer the session component drives
// via useReducer — no clocks, no IO, no randomness inside transitions, so
// every path is unit-testable.
//
// Queue semantics: "Got it" removes the current card; "Needs work" recycles
// it to the back. The queue never grows, so a session always terminates once
// everything has been graded "Got it"; the deliberate escape hatch for a
// hopeless card is the UI's Quit action (which still records the partial
// results via summarizeQuiz).
import type { TrainerCard } from './trainer-pools'

export type TrainerGrade = 'got-it' | 'needs-work'

export interface CardResult {
  subjectId: number
  firstTryCorrect: boolean // fixed by the FIRST grade, immutable after
  attempts: number // total grades received, recycles included
}

export interface QuizState {
  phase: 'front' | 'revealed' | 'complete'
  queue: TrainerCard[] // queue[0] is the current card
  results: Record<number, CardResult>
  totalCards: number
}

export type QuizAction = { type: 'reveal' } | { type: 'grade'; grade: TrainerGrade }

export interface QuizSummary {
  totalCards: number
  gradedCards: number
  firstTryCorrect: number
  cards: CardResult[]
}

/** Non-mutating Fisher–Yates; rng is injectable so tests can seed it. */
export function shuffleCards<T>(cards: T[], rng: () => number = Math.random): T[] {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createQuiz(cards: TrainerCard[], rng: () => number = Math.random): QuizState {
  const queue = shuffleCards(cards, rng)
  return {
    phase: queue.length > 0 ? 'front' : 'complete',
    queue,
    results: {},
    totalCards: queue.length,
  }
}

export function currentCard(state: QuizState): TrainerCard | null {
  return state.queue[0] ?? null
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'reveal': {
      // Guards double-taps and keyboard races: reveal only flips the front
      if (state.phase !== 'front') return state
      return { ...state, phase: 'revealed' }
    }

    case 'grade': {
      if (state.phase !== 'revealed') return state
      const card = state.queue[0]

      const existing = state.results[card.subjectId]
      const result: CardResult = existing
        ? { ...existing, attempts: existing.attempts + 1 }
        : {
            subjectId: card.subjectId,
            firstTryCorrect: action.grade === 'got-it',
            attempts: 1,
          }
      const results = { ...state.results, [card.subjectId]: result }

      if (action.grade === 'got-it') {
        const queue = state.queue.slice(1)
        return {
          ...state,
          phase: queue.length === 0 ? 'complete' : 'front',
          queue,
          results,
        }
      }

      // needs-work: recycle to the back (a single-card queue stays in place)
      const queue = [...state.queue.slice(1), card]
      return { ...state, phase: 'front', queue, results }
    }
  }
}

/** Works on any state, complete or not — the abort path summarizes too. */
export function summarizeQuiz(state: QuizState): QuizSummary {
  const cards = Object.values(state.results)
  return {
    totalCards: state.totalCards,
    gradedCards: cards.length,
    firstTryCorrect: cards.filter((c) => c.firstTryCorrect).length,
    cards,
  }
}
