import { create } from 'zustand'

export interface FlashcardRow {
  id: number
  word_id: number
  word: string
  ipa: string | null
  audio_url: string | null
  definition: string | null
  examples: string | null
  due_date: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: 'new' | 'learning' | 'review' | 'relearning'
}

export type QueueSource = 'srs' | 'vocab_set'
export type QueueSourceType = 'flashcards' | 'vocab_set'

interface SessionState {
  queue: FlashcardRow[]
  currentIndex: number
  results: { cardId: number; rating: number }[]
  isFlipped: boolean
  queueSource: QueueSource
  queueType: QueueSourceType
  queueId: number | null
  setQueue: (q: FlashcardRow[], source?: QueueSource, type?: QueueSourceType, id?: number | null) => void
  flip: () => void
  advance: () => void
  recordRating: (cardId: number, rating: number) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  queue: [],
  currentIndex: 0,
  results: [],
  isFlipped: false,
  queueSource: 'srs',
  queueType: 'flashcards',
  queueId: null,
  setQueue: (queue, source = 'srs', type = 'flashcards', id = null) =>
    set({ queue, currentIndex: 0, results: [], isFlipped: false, queueSource: source, queueType: type, queueId: id }),
  flip: () => set({ isFlipped: true }),
  advance: () => set((s) => ({ currentIndex: s.currentIndex + 1, isFlipped: false })),
  recordRating: (cardId, rating) =>
    set((s) => ({ results: [...s.results, { cardId, rating }] })),
  reset: () => set({ queue: [], currentIndex: 0, results: [], isFlipped: false, queueSource: 'srs', queueType: 'flashcards', queueId: null })
}))
