import { useCallback } from 'react';
export function useUnitProgress() {
    const calculateUnitCompletion = useCallback(async (unitId) => {
        const result = await window.api.db.all(`SELECT
        (SELECT COUNT(*) FROM lessons WHERE unit_id = ?) as total,
        (SELECT COUNT(*) FROM lessons l
         JOIN lesson_progress lp ON lp.lesson_id = l.id
         WHERE l.unit_id = ? AND lp.score >= 80) as completed
       FROM lessons WHERE unit_id = ? LIMIT 1`, [unitId, unitId, unitId]);
        if (!result[0] || result[0].total === 0)
            return 0;
        return Math.round((result[0].completed / result[0].total) * 100);
    }, []);
    const updateUnitProgress = useCallback(async (unitId) => {
        const percent = await calculateUnitCompletion(unitId);
        await window.api.db.run(`INSERT INTO unit_progress (unit_id, percent_complete)
       VALUES (?, ?)
       ON CONFLICT(unit_id) DO UPDATE SET percent_complete = ?`, [unitId, percent, percent]);
    }, [calculateUnitCompletion]);
    const checkAndUnlockNext = useCallback(async (completedUnitId) => {
        const result = await window.api.db.all(`SELECT u.id, u.unlocked
       FROM units u
       WHERE u.unit_order = (
         SELECT unit_order FROM units WHERE id = ?
       ) + 1`);
        if (result.length === 0)
            return false;
        const percent = await calculateUnitCompletion(completedUnitId);
        if (percent >= 80 && result[0].unlocked === 0) {
            await window.api.db.run(`UPDATE units SET unlocked = 1 WHERE id = ?`, [result[0].id]);
            await window.api.db.run(`UPDATE unit_progress SET unlocked_at = datetime('now') WHERE unit_id = ?`, [result[0].id]);
            return true;
        }
        return false;
    }, [calculateUnitCompletion]);
    const unlockUnit = useCallback(async (unitId) => {
        await window.api.db.run(`UPDATE units SET unlocked = 1 WHERE id = ?`, [unitId]);
        await window.api.db.run(`INSERT INTO unit_progress (unit_id, percent_complete, unlocked_at)
       VALUES (?, 0, datetime('now'))
       ON CONFLICT(unit_id) DO UPDATE SET unlocked_at = datetime('now')`, [unitId]);
    }, []);
    const completeLesson = useCallback(async (lessonId, score) => {
        await window.api.db.run(`INSERT INTO lesson_progress (lesson_id, completed_at, score)
       VALUES (?, datetime('now'), ?)`, [lessonId, score]);
        const lessonResult = await window.api.db.all(`SELECT unit_id FROM lessons WHERE id = ?`, [lessonId]);
        if (lessonResult.length === 0)
            return;
        const unitId = lessonResult[0].unit_id;
        await updateUnitProgress(unitId);
        if (score >= 80) {
            await checkAndUnlockNext(unitId);
        }
    }, [updateUnitProgress, checkAndUnlockNext]);
    return {
        calculateUnitCompletion,
        updateUnitProgress,
        checkAndUnlockNext,
        unlockUnit,
        completeLesson,
    };
}
