import { create } from 'zustand'

interface DailyStats {
  date: string
  wordsReviewed: number
  newWords: number
  listeningMins: number
  speakingMins: number
  writingMins: number
  streak: number
}

interface ProgressState {
  todayStats: DailyStats | null
  setTodayStats: (stats: DailyStats) => void
  incrementWordsReviewed: (n?: number) => void
}

const today = () => new Date().toISOString().slice(0, 10)

export const useProgressStore = create<ProgressState>()((set, get) => ({
  todayStats: null,
  setTodayStats: (todayStats) => set({ todayStats }),
  incrementWordsReviewed: (n = 1) => {
    const s = get().todayStats
    if (s) set({ todayStats: { ...s, wordsReviewed: s.wordsReviewed + n } })
  }
}))
