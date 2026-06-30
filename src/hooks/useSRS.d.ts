import { type Rating } from '../lib/srs/fsrs';
import { type FlashcardRow } from '../store/sessionStore';
export declare function useSRS(): {
    loadDueCards: (limit?: number) => Promise<FlashcardRow[]>;
    loadVocabSetCards: (vocabSetId: number, limit?: number) => Promise<FlashcardRow[]>;
    applyRating: (card: FlashcardRow, rating: Rating) => Promise<import("../lib/srs/fsrs").ScheduleResult>;
    addWordToFlashcards: (wordId: number) => Promise<void>;
    generateMnemonic: (word: string) => Promise<string>;
    saveMnemonic: (wordId: number, mnemonic: string) => Promise<void>;
};
