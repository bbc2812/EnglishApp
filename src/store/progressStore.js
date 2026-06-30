import { create } from 'zustand';
export const useProgressStore = create()((set, get) => ({
    todayStats: null,
    units: [],
    todayXP: 0,
    setTodayStats: (todayStats) => set({ todayStats }),
    incrementWordsReviewed: (n = 1) => {
        const s = get().todayStats;
        if (s)
            set({ todayStats: { ...s, wordsReviewed: s.wordsReviewed + n } });
    },
    setUnits: (units) => set({ units }),
    setTodayXP: (todayXP) => set({ todayXP }),
    loadUnits: async () => {
        const rows = await window.api.db.all(`SELECT u.id, u.title, u.cefr_level, u.unit_order, u.description, u.unlocked,
              COALESCE(up.percent_complete, 0) as percent_complete
       FROM units u
       LEFT JOIN unit_progress up ON up.unit_id = u.id
       ORDER BY u.unit_order`);
        set({ units: rows });
    }
}));
