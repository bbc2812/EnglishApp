export type Rating = 1 | 2 | 3 | 4;
export interface Card {
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: 'new' | 'learning' | 'review' | 'relearning';
    last_review: string | null;
}
export interface ScheduleResult {
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: 'new' | 'learning' | 'review' | 'relearning';
    last_review: string;
    due_date: string;
}
export declare function schedule(card: Card, rating: Rating): ScheduleResult;
