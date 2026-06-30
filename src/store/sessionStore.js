import { create } from 'zustand';
export const useSessionStore = create()((set) => ({
    queue: [],
    currentIndex: 0,
    results: [],
    isFlipped: false,
    queueSource: 'srs',
    queueType: 'flashcards',
    queueId: null,
    setQueue: (queue, source = 'srs', type = 'flashcards', id = null) => set({ queue, currentIndex: 0, results: [], isFlipped: false, queueSource: source, queueType: type, queueId: id }),
    flip: () => set({ isFlipped: true }),
    advance: () => set((s) => ({ currentIndex: s.currentIndex + 1, isFlipped: false })),
    recordRating: (cardId, rating) => set((s) => ({ results: [...s.results, { cardId, rating }] })),
    reset: () => set({ queue: [], currentIndex: 0, results: [], isFlipped: false, queueSource: 'srs', queueType: 'flashcards', queueId: null })
}));
