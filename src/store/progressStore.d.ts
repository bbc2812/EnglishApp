interface DailyStats {
    date: string;
    wordsReviewed: number;
    newWords: number;
    listeningMins: number;
    speakingMins: number;
    writingMins: number;
    streak: number;
}
export interface UnitProgress {
    id: number;
    title: string;
    cefr_level: string;
    unit_order: number;
    description: string;
    unlocked: number;
    percent_complete: number;
}
interface ProgressState {
    todayStats: DailyStats | null;
    setTodayStats: (stats: DailyStats) => void;
    incrementWordsReviewed: (n?: number) => void;
    units: UnitProgress[];
    setUnits: (units: UnitProgress[]) => void;
    loadUnits: () => Promise<void>;
    todayXP: number;
    setTodayXP: (xp: number) => void;
}
export declare const useProgressStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ProgressState>>;
export {};
