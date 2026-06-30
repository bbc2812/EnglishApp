import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
const COLORS = ['#38bdf8', '#22c55e', '#eab308', '#ef4444', '#a855f7'];
export default function Stats() {
    const [dailyStats, setDailyStats] = useState([]);
    const [totalWords, setTotalWords] = useState(0);
    const [flashcards, setFlashcards] = useState(0);
    const [streak, setStreak] = useState(0);
    const [totalXp, setTotalXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [mistakes, setMistakes] = useState([]);
    const [activityData, setActivityData] = useState([]);
    const loadData = async () => {
        const stats = await window.api.db.all(`SELECT * FROM daily_stats ORDER BY date DESC LIMIT 30`);
        setDailyStats(stats);
        const wc = await window.api.db.all(`SELECT COUNT(*) as c FROM words`);
        setTotalWords(wc[0]?.c || 0);
        const fc = await window.api.db.all(`SELECT COUNT(*) as c FROM flashcards`);
        setFlashcards(fc[0]?.c || 0);
        const st = await window.api.db.all(`SELECT MAX(streak) as s FROM daily_stats`);
        setStreak(st[0]?.s || 0);
        await window.api.db.all(`SELECT COUNT(*) as c FROM units WHERE unlocked = 1`).catch(() => { });
        const xp = await window.api.db.all(`SELECT SUM(xp_earned) as total FROM daily_stats`);
        setTotalXp(xp[0]?.total || 0);
        setLevel(Math.floor((xp[0]?.total || 0) / 100) + 1);
        const ms = await window.api.db.all(`SELECT type, count FROM grammar_mistakes ORDER BY count DESC LIMIT 10`);
        setMistakes(ms);
        // Activity breakdown from last 7 days
        const sevenDayStats = await window.api.db.all(`SELECT
        COALESCE(SUM(listening_mins), 0) as listening,
        COALESCE(SUM(speaking_mins), 0) as speaking,
        COALESCE(SUM(writing_mins), 0) as writing
       FROM daily_stats WHERE date >= date('now', '-7 days')`);
        const a = sevenDayStats[0];
        setActivityData([
            { name: 'Listening', value: a.listening || 0 },
            { name: 'Speaking', value: a.speaking || 0 },
            { name: 'Writing', value: a.writing || 0 },
            { name: 'Flashcards', value: flashcards * 2 },
        ]);
    };
    useEffect(() => { loadData(); }, []);
    const chartData = dailyStats.slice().reverse().map(s => ({
        name: s.date.slice(5),
        value: s.words_reviewed,
        xp: s.xp_earned,
        words: s.words_reviewed + s.new_words,
        listening: s.listening_mins,
        speaking: s.speaking_mins,
        writing: s.writing_mins,
    }));
    // Streak heatmap (last 28 days)
    const heatmapData = Array.from({ length: 28 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (27 - i));
        const dateStr = d.toISOString().slice(0, 10);
        const stat = dailyStats.find(s => s.date === dateStr);
        return {
            date: dateStr,
            activity: stat ? (stat.words_reviewed + stat.xp_earned) : 0,
        };
    });
    const getHeatColor = (v) => {
        if (v === 0)
            return '#1f2937';
        if (v < 10)
            return '#166534';
        if (v < 30)
            return '#15803d';
        if (v < 50)
            return '#22c55e';
        return '#4ade80';
    };
    return (<div className="p-8 flex flex-col h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Learning Analytics</h2>
      <p className="text-gray-400 text-sm mt-1">Your progress, habits, and growth over time</p>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 mb-6">
        {[
            { label: 'Total XP', value: totalXp, icon: '⭐' },
            { label: 'Level', value: level, icon: '🎓' },
            { label: 'Words Learned', value: totalWords, icon: '📚' },
            { label: 'Flashcards', value: flashcards, icon: '🃏' },
            { label: 'Best Streak', value: `${streak} days`, icon: '🔥' },
        ].map((s, i) => (<motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="card text-center p-4">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </motion.div>))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Words Reviewed */}
        <div className="card">
          <h4 className="text-sm font-semibold text-white mb-3">Words Reviewed (30 days)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }}/>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }}/>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}/>
              <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="#38bdf830"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* XP Over Time */}
        <div className="card">
          <h4 className="text-sm font-semibold text-white mb-3">XP Earned (30 days)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }}/>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }}/>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}/>
              <Line type="monotone" dataKey="xp" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 2 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Activity Breakdown */}
        <div className="card">
          <h4 className="text-sm font-semibold text-white mb-3">Activity Breakdown (7 days)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={activityData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {activityData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]}/>))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Streak Heatmap */}
        <div className="card">
          <h4 className="text-sm font-semibold text-white mb-3">Activity Heatmap (28 days)</h4>
          <div className="flex flex-wrap gap-1">
            {heatmapData.map((d, i) => (<div key={i} className="w-6 h-6 rounded" style={{ backgroundColor: getHeatColor(d.activity) }} title={`${d.date}: ${d.activity} activity`}/>))}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-gray-500">Less</span>
            {['#1f2937', '#166534', '#15803d', '#22c55e', '#4ade80'].map(c => (<div key={c} className="w-3 h-3 rounded" style={{ backgroundColor: c }}/>))}
            <span className="text-xs text-gray-500 ml-1">More</span>
          </div>
        </div>
      </div>

      {/* CEFR Progress */}
      <div className="card mb-4">
        <h4 className="text-sm font-semibold text-white mb-3">Estimated CEFR Level</h4>
        <div className="flex items-center gap-4">
          {['A2', 'B1', 'B2', 'C1', 'C2'].map((cefr, i) => {
            const thresholds = [50, 200, 500, 1000, 2000];
            const progress = Math.min(100, Math.max(0, ((totalXp - thresholds[i]) / (thresholds[i + 1] - thresholds[i])) * 100));
            const isComplete = totalXp >= thresholds[i];
            return (<div key={cefr} className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${isComplete ? 'text-white' : 'text-gray-500'}`}>{cefr}</span>
                  <span className="text-xs text-gray-500">{thresholds[i]} XP</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isComplete ? 'bg-brand-500' : 'bg-gray-600'}`} style={{ width: `${progress}%` }}/>
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* Top Mistakes */}
      <div className="card">
        <h4 className="text-sm font-semibold text-white mb-3">Top Grammar Mistakes</h4>
        {mistakes.length === 0 ? (<p className="text-gray-500 text-sm">No mistakes recorded yet. Keep writing!</p>) : (<ResponsiveContainer width="100%" height={150}>
            <BarChart data={mistakes.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="type" tick={{ fill: '#9ca3af', fontSize: 9 }}/>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }}/>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}/>
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>)}
      </div>

      {/* Known Vocabulary Estimate */}
      <div className="card mt-4">
        <h4 className="text-sm font-semibold text-white mb-2">🧠 Known Vocabulary Estimate</h4>
        <p className="text-4xl font-bold text-brand-400 mb-1">{Math.round(totalWords * 0.8 + flashcards * 0.3)}</p>
        <p className="text-sm text-gray-400">words based on {totalWords} saved + {flashcards} active flashcards</p>
        <p className="text-xs text-gray-500 mt-2">
          B1: ~2,000 words · B2: ~4,000 words · C1: ~8,000 words · C2: ~16,000 words
        </p>
      </div>
    </div>);
}
