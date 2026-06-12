import { describe, expect, it } from 'vitest'
import {
  createQuiz,
  currentCard,
  quizReducer,
  shuffleCards,
  summarizeQuiz,
  type QuizState,
} from './trainer-quiz'
import type { TrainerCard } from './trainer-pools'

// Deterministic PRNG for seedable shuffles (mulberry32)
function seededRng(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCard(subjectId: number): TrainerCard {
  return {
    subjectId,
    character: '例',
    type: 'kanji',
    level: 1,
    primaryMeaning: 'Example',
    allMeanings: ['Example'],
    readings: { primary: 'れい', primaryType: 'onyomi', onyomi: ['れい'], kunyomi: [], vocabulary: [] },
    audioUrl: null,
    documentUrl: 'https://www.wanikani.com/kanji/example',
    currentSRS: 1,
    accuracy: 50,
    meaningAccuracy: 50,
    readingAccuracy: 50,
    totalReviews: 10,
    incorrectCount: 5,
  }
}

const cards = [1, 2, 3, 4].map(makeCard)
const identityRng = () => 0.999999 // Fisher–Yates no-op: every j === i

function reveal(state: QuizState): QuizState {
  return quizReducer(state, { type: 'reveal' })
}
function grade(state: QuizState, g: 'got-it' | 'needs-work'): QuizState {
  return quizReducer(state, { type: 'grade', grade: g })
}

describe('shuffleCards — seedable shuffle', () => {
  it('is deterministic for a given rng seed', () => {
    const a = shuffleCards(cards, seededRng(42))
    const b = shuffleCards(cards, seededRng(42))
    expect(a.map((c) => c.subjectId)).toEqual(b.map((c) => c.subjectId))
  })

  it('returns a permutation without mutating the input', () => {
    const input = [...cards]
    const shuffled = shuffleCards(input, seededRng(7))
    expect(input).toEqual(cards)
    expect(shuffled.map((c) => c.subjectId).sort()).toEqual([1, 2, 3, 4])
  })
})

describe('createQuiz — initial state', () => {
  it('starts at front with the full shuffled queue', () => {
    const state = createQuiz(cards, identityRng)
    expect(state.phase).toBe('front')
    expect(state.totalCards).toBe(4)
    expect(state.queue.map((c) => c.subjectId)).toEqual([1, 2, 3, 4])
    expect(currentCard(state)?.subjectId).toBe(1)
  })

  it('is immediately complete for an empty deck', () => {
    const state = createQuiz([], identityRng)
    expect(state.phase).toBe('complete')
    expect(currentCard(state)).toBeNull()
  })
})

describe('quizReducer — phase guards', () => {
  it('reveal is a no-op unless on the front', () => {
    const front = createQuiz(cards, identityRng)
    const revealed = reveal(front)
    expect(revealed.phase).toBe('revealed')
    expect(reveal(revealed)).toBe(revealed)
  })

  it('grade is a no-op unless revealed', () => {
    const front = createQuiz(cards, identityRng)
    expect(grade(front, 'got-it')).toBe(front)
  })
})

describe('quizReducer — grading', () => {
  it('got-it removes the current card and returns to front', () => {
    const state = grade(reveal(createQuiz(cards, identityRng)), 'got-it')
    expect(state.phase).toBe('front')
    expect(state.queue.map((c) => c.subjectId)).toEqual([2, 3, 4])
    expect(state.results[1]).toEqual({ subjectId: 1, firstTryCorrect: true, attempts: 1 })
  })

  it('the last got-it completes the quiz', () => {
    let state = createQuiz([makeCard(1)], identityRng)
    state = grade(reveal(state), 'got-it')
    expect(state.phase).toBe('complete')
    expect(state.queue).toEqual([])
  })

  it('needs-work recycles the card to the back, preserving the rest', () => {
    const state = grade(reveal(createQuiz(cards, identityRng)), 'needs-work')
    expect(state.phase).toBe('front')
    expect(state.queue.map((c) => c.subjectId)).toEqual([2, 3, 4, 1])
    expect(state.results[1]).toEqual({ subjectId: 1, firstTryCorrect: false, attempts: 1 })
  })

  it('a single-card queue recycles in place and never completes on needs-work', () => {
    let state = createQuiz([makeCard(1)], identityRng)
    state = grade(reveal(state), 'needs-work')
    expect(state.phase).toBe('front')
    expect(state.queue.map((c) => c.subjectId)).toEqual([1])

    state = grade(reveal(state), 'got-it')
    expect(state.phase).toBe('complete')
  })

  it('the first grade fixes firstTryCorrect permanently; attempts keep counting', () => {
    let state = createQuiz([makeCard(1), makeCard(2)], identityRng)
    state = grade(reveal(state), 'needs-work') // card 1: first attempt wrong
    state = grade(reveal(state), 'got-it') // card 2 cleared
    state = grade(reveal(state), 'needs-work') // card 1 again
    state = grade(reveal(state), 'got-it') // card 1 finally cleared

    expect(state.phase).toBe('complete')
    expect(state.results[1]).toEqual({ subjectId: 1, firstTryCorrect: false, attempts: 3 })
    expect(state.results[2]).toEqual({ subjectId: 2, firstTryCorrect: true, attempts: 1 })
  })
})

describe('summarizeQuiz', () => {
  it('summarizes a completed session', () => {
    let state = createQuiz([makeCard(1), makeCard(2)], identityRng)
    state = grade(reveal(state), 'needs-work')
    state = grade(reveal(state), 'got-it')
    state = grade(reveal(state), 'got-it')

    const summary = summarizeQuiz(state)
    expect(summary.totalCards).toBe(2)
    expect(summary.gradedCards).toBe(2)
    expect(summary.firstTryCorrect).toBe(1)
    expect(summary.cards).toHaveLength(2)
  })

  it('summarizes a partial session (abort path)', () => {
    let state = createQuiz(cards, identityRng)
    state = grade(reveal(state), 'got-it')

    const summary = summarizeQuiz(state)
    expect(summary.totalCards).toBe(4)
    expect(summary.gradedCards).toBe(1)
    expect(summary.firstTryCorrect).toBe(1)
  })
})
