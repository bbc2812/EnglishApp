export interface FlashcardRow {
    id: number;
    word_id: number;
    word: string;
    ipa: string | null;
    audio_url: string | null;
    definition: string | null;
    examples: string | null;
    mnemonic: string | null;
    source_sentence: string | null;
    source_url: string | null;
    due_date: string;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: 'new' | 'learning' | 'review' | 'relearning';
}
export type QueueSource = 'srs' | 'vocab_set';
export type QueueSourceType = 'flashcards' | 'vocab_set';
interface SessionState {
    queue: FlashcardRow[];
    currentIndex: number;
    results: {
        cardId: number;
        rating: number;
    }[];
    isFlipped: boolean;
    queueSource: QueueSource;
    queueType: QueueSourceType;
    queueId: number | null;
    setQueue: (q: FlashcardRow[], source?: QueueSource, type?: QueueSourceType, id?: number | null) => void;
    flip: () => void;
    advance: () => void;
    recordRating: (cardId: number, rating: number) => void;
    reset: () => void;
}
export declare const useSessionStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SessionState>>;
export {};
