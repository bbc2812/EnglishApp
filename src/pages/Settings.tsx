import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'

const ACHIEVEMENTS = [
  { id: 1, key: 'first_card', title: '🔥 First Flame', desc: 'Complete first flashcard session', icon: '🔥' },
  { id: 2, key: 'word_hoarder', title: '📚 Word Hoarder', desc: 'Add 100 words to deck', icon: '📚' },
  { id: 3, key: 'sharpshooter', title: '🎯 Sharpshooter', desc: '7-day streak', icon: '🎯' },
  { id: 4, key: 'mimic_master', title: '🗣️ Mimic Master', desc: 'Score 90%+ in shadowing', icon: '🗣️' },
  { id: 5, key: 'essay_writer', title: '✍️ Essay Writer', desc: 'Submit 5 writing prompts', icon: '✍️' },
  { id: 6, key: 'b2_graduate', title: '🎓 B2 Graduate', desc: 'Complete units 1-4', icon: '🎓' },
  { id: 7, key: 'c1_champion', title: '🏆 C1 Champion', desc: 'Complete units 5-8', icon: '🏆' },
  { id: 8, key: 'daily_warrior', title: '⚔️ Daily Warrior', desc: 'Complete 7 daily challenges', icon: '⚔️' },
  { id: 9, key: 'tutor_fan', title: '💬 Tutor Fan', desc: 'Send 50 messages to AI Tutor', icon: '💬' },
  { id: 10, key: 'speed_reader', title: '⚡ Speed Reader', desc: 'Complete 10 reading lessons', icon: '⚡' },
]

function SettingRow({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800">
      <span className="text-sm text-gray-300">{label}</span>
      {children}
    </div>
  )
}

function XPBar({ xp, level }: { xp: number; level: number }): JSX.Element {
  const nextLevelXp = level * 100
  const prevLevelXp = (level - 1) * 100
  const progress = ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">Level {level}</span>
        <span className="text-xs text-gray-500">{xp}/{nextLevelXp} XP</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

export default function Settings(): JSX.Element {
  const {
    claudeApiKey, ollamaUrl, ollamaModel, geminiApiKey, activeProvider,
    setClaudeApiKey, setOllamaUrl, setOllamaModel, setGeminiApiKey,
    setActiveProvider, dailyNewWords, setDailyNewWords,
    bilingualGrammar, setBilingualGrammar,
    newsApiKey, setNewsApiKey, systemTray, setSystemTray,
    clipboardHotkey, setClipboardHotkey, readingGoalMins, setReadingGoalMins,
    theme, setTheme,
    shadowingScoring, setShadowingScoring,
    shadowingFeedbackLang, setShadowingFeedbackLang,
    shadowingTargetScore, setShadowingTargetScore
  } = useSettingsStore()

  const [saved, setSaved] = useState(false)
  const [achievements, setAchievements] = useState<string[]>([])
  const [totalXp, setTotalXp] = useState(0)
  const [level, setLevel] = useState(1)

  useEffect(() => {
    if (!window.api?.db) return
    window.api.db.all(`SELECT key, unlocked_at FROM achievements WHERE unlocked_at IS NOT NULL`)
      .then(rows => setAchievements((rows as { key: string }[]).map(r => r.key)))

    window.api.db.all(`SELECT SUM(score || 0) as total_xp FROM writing_history`)
      .then(rows => {
        const xp = (rows as { total_xp?: number }[])[0]?.total_xp || 0
        setTotalXp(xp)
        setLevel(Math.floor(xp / 100) + 1)
      }).catch(() => {})

    const checkAchievements = async () => {
      if (!window.api?.db) return
      const wordCount = await window.api.db.all(`SELECT COUNT(*) as c FROM words`) as { c: number }[]
      const streak = await window.api.db.all(`SELECT streak FROM daily_stats ORDER BY date DESC LIMIT 1`) as { streak: number }[]
      const writingCount = await window.api.db.all(`SELECT COUNT(*) as c FROM writing_history`) as { c: number }[]
      const convCount = await window.api.db.all(`SELECT COUNT(*) as c FROM conversations`) as { c: number }[]
      const lessonCount = await window.api.db.all(`SELECT COUNT(*) as c FROM lesson_progress WHERE score >= 80`) as { c: number }[]
      const flashcardCount = await window.api.db.all(`SELECT COUNT(*) as c FROM flashcards`) as { c: number }[]
      const shadowingBest = await window.api.db.all(`SELECT MAX(match_score) as best FROM shadowing_sessions`) as { best?: number }[]
      const unlockedUnits = await window.api.db.all(`SELECT COUNT(*) as c FROM units WHERE unlocked = 1`) as { c: number }[]

      const newAchievements: string[] = []

      if (flashcardCount[0]?.c && flashcardCount[0].c > 0 && !achievements.includes('first_card')) newAchievements.push('first_card')
      if (wordCount[0]?.c && wordCount[0].c >= 100 && !achievements.includes('word_hoarder')) newAchievements.push('word_hoarder')
      if (streak[0]?.streak && streak[0].streak >= 7 && !achievements.includes('sharpshooter')) newAchievements.push('sharpshooter')
      if (shadowingBest[0]?.best && shadowingBest[0].best >= 90 && !achievements.includes('mimic_master')) newAchievements.push('mimic_master')
      if (writingCount[0]?.c && writingCount[0].c >= 5 && !achievements.includes('essay_writer')) newAchievements.push('essay_writer')
      if (convCount[0]?.c && convCount[0].c >= 50 && !achievements.includes('tutor_fan')) newAchievements.push('tutor_fan')
      if (lessonCount[0]?.c && lessonCount[0].c >= 10 && !achievements.includes('speed_reader')) newAchievements.push('speed_reader')
      if (unlockedUnits[0]?.c && unlockedUnits[0].c >= 4 && !achievements.includes('b2_graduate')) newAchievements.push('b2_graduate')
      if (unlockedUnits[0]?.c && unlockedUnits[0].c >= 8 && !achievements.includes('c1_champion')) newAchievements.push('c1_champion')

      if (newAchievements.length > 0) {
        for (const key of newAchievements) {
          const a = ACHIEVEMENTS.find(x => x.key === key)
          await window.api.db.run(
            `INSERT INTO achievements (key, title, description, icon, unlocked_at)
             VALUES (?, ?, ?, ?, datetime('now'))
             ON CONFLICT(key) DO NOTHING`,
            [key, a?.title || '', a?.desc || '', a?.icon || '🏅']
          )
        }
        setAchievements(prev => [...prev, ...newAchievements])
      }
    }

    checkAchievements()
  }, [achievements])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
      <p className="text-gray-400 text-sm mb-8">API keys, AI provider, content sources, and preferences</p>

      {/* Profile */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl">
            🧠
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">Learner</p>
            <XPBar xp={totalXp} level={level} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ACHIEVEMENTS.map(a => achievements.includes(a.key) && (
            <span key={a.id} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded" title={a.desc}>
              {a.icon} {a.title.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Content Sources */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">📡 Content Sources</h3>

        <SettingRow label="NewsAPI Key">
          <input type="password" value={newsApiKey} onChange={e => setNewsApiKey(e.target.value)}
            placeholder="newsapi key" className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-48 focus:border-brand-500 focus:outline-none" />
        </SettingRow>

        <SettingRow label="Reading Goal (mins/day)">
          <input type="number" value={readingGoalMins} onChange={e => setReadingGoalMins(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-20 focus:border-brand-500 focus:outline-none" />
        </SettingRow>
      </div>

      {/* AI Provider Settings */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">🤖 AI Provider Settings</h3>

        <SettingRow label="Active Provider">
          <div className="flex gap-1">
            {(['claude', 'ollama', 'gemini'] as const).map(p => (
              <button key={p} onClick={() => setActiveProvider(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium ${activeProvider === p ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {p === 'claude' ? '🟣 Claude' : p === 'gemini' ? '🟡 Gemini' : '🤖 Ollama'}
              </button>
            ))}
          </div>
        </SettingRow>

        {activeProvider === 'claude' && (
          <SettingRow label="Claude API Key">
            <input type="password" value={claudeApiKey} onChange={e => setClaudeApiKey(e.target.value)}
              placeholder="sk-ant-..." className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-48 focus:border-brand-500 focus:outline-none" />
          </SettingRow>
        )}

        {activeProvider === 'gemini' && (
          <SettingRow label="Gemini API Key">
            <input type="password" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)}
              placeholder="AIza..." className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-48 focus:border-brand-500 focus:outline-none" />
          </SettingRow>
        )}

        {activeProvider === 'ollama' && (
          <>
            <SettingRow label="Ollama URL">
              <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434" className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-48 focus:border-brand-500 focus:outline-none" />
            </SettingRow>
            <SettingRow label="Ollama Model">
              <input type="text" value={ollamaModel} onChange={e => setOllamaModel(e.target.value)}
                placeholder="llama3.2" className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-48 focus:border-brand-500 focus:outline-none" />
            </SettingRow>
          </>
        )}
      </div>

      {/* Learning Settings */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">📚 Learning Preferences</h3>

        <SettingRow label="Daily New Words">
          <input type="number" value={dailyNewWords} onChange={e => setDailyNewWords(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-20 focus:border-brand-500 focus:outline-none" />
        </SettingRow>

        <SettingRow label="Bilingual Grammar Explanations">
          <button onClick={() => setBilingualGrammar(!bilingualGrammar)}
            className={`px-3 py-1 rounded-md text-xs font-medium ${bilingualGrammar ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {bilingualGrammar ? '✅ On' : '❌ Off'}
          </button>
        </SettingRow>
      </div>

      {/* Shadowing Settings */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">🎤 Shadowing & Pronunciation</h3>

        <SettingRow label="Scoring Method">
          <div className="flex gap-1">
            {(['simulated', 'ai'] as const).map(s => (
              <button key={s}
                onClick={() => setShadowingScoring(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize ${
                  shadowingScoring === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                {s === 'simulated' ? '⚡ Simulated' : '🤖 AI'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1">Simulated = instant & free, AI = needs API key but more accurate</p>
        </SettingRow>

        <SettingRow label="Target Score (to pass)">
          <input type="range" min="50" max="95" step="5" value={shadowingTargetScore}
            onChange={e => setShadowingTargetScore(Number(e.target.value))}
            className="w-32" />
          <span className="text-sm text-white w-12 text-right">{shadowingTargetScore}%</span>
        </SettingRow>

        <SettingRow label="Subtitle Language">
          <div className="flex gap-1">
            {(['en', 'vn', 'both'] as const).map(l => (
              <button key={l}
                onClick={() => setShadowingFeedbackLang(l)}
                className={`px-3 py-1 rounded-md text-xs font-medium ${
                  shadowingFeedbackLang === l
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                {l === 'both' ? 'EN+VN' : l.toUpperCase()}
              </button>
            ))}
          </div>
        </SettingRow>
      </div>

      {/* App Settings */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">⚡ App Settings</h3>

        <SettingRow label="Global Hotkey (Ctrl+Shift+D)">
          <button onClick={() => setClipboardHotkey(!clipboardHotkey)}
            className={`px-3 py-1 rounded-md text-xs font-medium ${clipboardHotkey ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {clipboardHotkey ? '✅ On' : '❌ Off'}
          </button>
        </SettingRow>

        <SettingRow label="System Tray">
          <button onClick={() => setSystemTray(!systemTray)}
            className={`px-3 py-1 rounded-md text-xs font-medium ${systemTray ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {systemTray ? '✅ On' : '❌ Off'}
          </button>
        </SettingRow>

        <SettingRow label="Theme">
          <div className="flex gap-1">
            <button onClick={() => setTheme('dark')}
              className={`px-3 py-1 rounded-md text-xs font-medium ${theme === 'dark' ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>🌙 Dark</button>
            <button onClick={() => setTheme('light')}
              className={`px-3 py-1 rounded-md text-xs font-medium ${theme === 'light' ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>☀️ Light</button>
            <button onClick={() => setTheme('auto')}
              className={`px-3 py-1 rounded-md text-xs font-medium ${theme === 'auto' ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>🔄 Auto</button>
          </div>
        </SettingRow>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave}
          className={`btn-primary px-6 py-2.5 text-sm ${saved ? '!bg-green-600' : ''}`}>
          {saved ? '✅ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
