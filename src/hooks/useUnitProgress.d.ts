export declare function useUnitProgress(): {
    calculateUnitCompletion: (unitId: number) => Promise<number>;
    updateUnitProgress: (unitId: number) => Promise<void>;
    checkAndUnlockNext: (completedUnitId: number) => Promise<boolean>;
    unlockUnit: (unitId: number) => Promise<void>;
    completeLesson: (lessonId: number, score: number) => Promise<void>;
};
