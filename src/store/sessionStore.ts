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
  reps: number
  lapses: number
  state: 'new' | 'learning' | 'review' | 'relearning'
}

interface SessionState {
  queue: FlashcardRow[]
  currentIndex: number
  results: { cardId: number; rating: number }[]
  isFlipped: boolean
  setQueue: (q: FlashcardRow[]) => void
  flip: () => void
  advance: () => void
  recordRating: (cardId: number, rating: number) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  queue: [],
  currentIndex: 0,
  results: [],
  isFlipped: false,
  setQueue: (queue) => set({ queue, currentIndex: 0, results: [], isFlipped: false }),
  flip: () => set({ isFlipped: true }),
  advance: () => set((s) => ({ currentIndex: s.currentIndex + 1, isFlipped: false })),
  recordRating: (cardId, rating) =>
    set((s) => ({ results: [...s.results, { cardId, rating }] })),
  reset: () => set({ queue: [], currentIndex: 0, results: [], isFlipped: false })
}))
