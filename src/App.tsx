import { useState, useEffect, useCallback } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Layout/Sidebar'
import DictionaryPopup from './components/DictionaryPopup'
import OnboardingModal from './components/OnboardingModal'
import Dashboard from './pages/Dashboard'
import Flashcards from './pages/Flashcards'
import Listening from './pages/Listening'
import Reading from './pages/Reading'
import Shadowing from './pages/Shadowing'
import Speaking from './pages/Speaking'
import Writing from './pages/Writing'
import News from './pages/News'
import Podcasts from './pages/Podcasts'
import AITutor from './pages/AITutor'
import Settings from './pages/Settings'

interface Toast {
  id: number
  message: string
  icon: string
}

function SharedToastContainer(): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [achievements, setAchievements] = useState<string[]>([])

  const addToast = useCallback((message: string, icon: string) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, icon }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const checkAchievements = async () => {
      // Load unlocked achievements
      const unlockedRows = await window.api.db.all(
        `SELECT key FROM achievements WHERE unlocked_at IS NOT NULL`
      ) as { key: string }[]
      const unlockedKeys = unlockedRows.map(r => r.key)
      setAchievements(unlockedKeys)

      // Check for newly unlocked achievements
      const wordCount = await window.api.db.all(`SELECT COUNT(*) as c FROM words`) as { c: number }[]
      const streak = await window.api.db.all(`SELECT streak FROM daily_stats ORDER BY date DESC LIMIT 1`) as { streak: number }[]
      const writingCount = await window.api.db.all(`SELECT COUNT(*) as c FROM writing_history`) as { c: number }[]
      const convCount = await window.api.db.all(`SELECT COUNT(*) as c FROM conversations`) as { c: number }[]
      const lessonCount = await window.api.db.all(`SELECT COUNT(*) as c FROM lesson_progress WHERE score >= 80`) as { c: number }[]
      const flashcardCount = await window.api.db.all(`SELECT COUNT(*) as c FROM flashcards`) as { c: number }[]
      const shadowingBest = await window.api.db.all(`SELECT MAX(match_score) as best FROM pronunciation_sessions`) as { best?: number }[]
      const unlockedUnits = await window.api.db.all(`SELECT COUNT(*) as c FROM units WHERE unlocked = 1`) as { c: number }[]

      const checks: { key: string; condition: boolean; title: string; icon: string }[] = [
        { key: 'first_card', condition: (flashcardCount[0]?.c ?? 0) > 0 && !achievements.includes('first_card'), title: '🔥 First Flame', icon: '🔥' },
        { key: 'word_hoarder', condition: (wordCount[0]?.c ?? 0) >= 100 && !achievements.includes('word_hoarder'), title: '📚 Word Hoarder', icon: '📚' },
        { key: 'sharpshooter', condition: (streak[0]?.streak ?? 0) >= 7 && !achievements.includes('sharpshooter'), title: '🎯 Sharpshooter', icon: '🎯' },
        { key: 'mimic_master', condition: (shadowingBest[0]?.best ?? 0) >= 90 && !achievements.includes('mimic_master'), title: '🗣️ Mimic Master', icon: '🗣️' },
        { key: 'essay_writer', condition: (writingCount[0]?.c ?? 0) >= 5 && !achievements.includes('essay_writer'), title: '✍️ Essay Writer', icon: '✍️' },
        { key: 'daily_warrior', condition: true, title: '⚔️ Daily Warrior', icon: '⚔️' }, // checked separately
        { key: 'tutor_fan', condition: (convCount[0]?.c ?? 0) >= 50 && !achievements.includes('tutor_fan'), title: '💬 Tutor Fan', icon: '💬' },
        { key: 'speed_reader', condition: (lessonCount[0]?.c ?? 0) >= 10 && !achievements.includes('speed_reader'), title: '⚡ Speed Reader', icon: '⚡' },
        { key: 'b2_graduate', condition: (unlockedUnits[0]?.c ?? 0) >= 4 && !achievements.includes('b2_graduate'), title: '🎓 B2 Graduate', icon: '🎓' },
        { key: 'c1_champion', condition: (unlockedUnits[0]?.c ?? 0) >= 8 && !achievements.includes('c1_champion'), title: '🏆 C1 Champion', icon: '🏆' },
      ]

      for (const check of checks) {
        if (check.condition && !achievements.includes(check.key)) {
          // Unlock the achievement
          await window.api.db.run(
            `INSERT INTO achievements (key, title, description, icon, unlocked_at)
             VALUES (?, ?, 'Achievement unlocked!', ?, datetime('now'))
             ON CONFLICT(key) DO NOTHING`,
            [check.key, check.title, check.title, check.icon]
          ).catch(() => {})
          addToast(`🏅 ${check.title} — Achievement Unlocked!`, check.icon)
          setAchievements(prev => [...prev, check.key])
        }
      }
    }

    // Check achievements every 5 seconds
    const interval = setInterval(checkAchievements, 5000)
    checkAchievements() // Initial check
    return () => clearInterval(interval)
  }, [achievements, addToast])

  return (
    <>
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl flex items-center gap-3"
            >
              <span className="text-xl">{toast.icon}</span>
              <p className="text-white text-sm flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-gray-500 hover:text-white text-xs">✕</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <OnboardingModal />
    </>
  )
}

export default function App(): JSX.Element {
  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <DictionaryPopup />
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/listening" element={<Listening />} />
            <Route path="/reading" element={<Reading />} />
            <Route path="/shadowing" element={<Shadowing />} />
            <Route path="/speaking" element={<Speaking />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/news" element={<News />} />
            <Route path="/podcasts" element={<Podcasts />} />
            <Route path="/tutor" element={<AITutor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <SharedToastContainer />
      </div>
    </HashRouter>
  )
}
