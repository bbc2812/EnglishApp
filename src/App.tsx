import { useState, useEffect, useCallback, useRef, Component, ReactNode } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Layout/Sidebar'
import DictionaryPopup from './components/DictionaryPopup'
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
import YouTube from './pages/YouTube'
import Import from './pages/Import'
import Stats from './pages/Stats'
import Learning from './pages/Learning'

class ErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary px-4 py-2"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface Toast {
  id: number
  message: string
  icon: string
}

function SharedToastContainer(): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [achievements, setAchievements] = useState<string[]>([])
  const processedKeysRef = useRef<Set<string>>(new Set())

  const addToast = useCallback((message: string, icon: string) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, icon }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    // Register clipboard hotkey handler
    if (window.api?.clipboard) {
      const cleanup = window.api.clipboard.onCapture((text) => {
        // Open dictionary popup with clipboard text
        const word = text.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-zA-Z'\-]/g, '').trim()
        if (word && word.length >= 2) {
          addToast(`🔍 Dictionary: "${word}"`, '📋')
        }
      })
      return cleanup
    }

    const checkAchievements = async () => {
      if (!window.api?.db) return
      const unlockedRows = await window.api.db.all(
        `SELECT key FROM achievements WHERE unlocked_at IS NOT NULL`
      ) as { key: string }[]
      const unlockedKeys = unlockedRows.map(r => r.key)
      setAchievements(unlockedKeys)

      const wordCount = await window.api.db.all(`SELECT COUNT(*) as c FROM words`) as { c: number }[]
      const streak = await window.api.db.all(`SELECT streak FROM daily_stats ORDER BY date DESC LIMIT 1`) as { streak: number }[]
      const writingCount = await window.api.db.all(`SELECT COUNT(*) as c FROM writing_history`) as { c: number }[]
      const convCount = await window.api.db.all(`SELECT COUNT(*) as c FROM conversations`) as { c: number }[]
      const lessonCount = await window.api.db.all(`SELECT COUNT(*) as c FROM lesson_progress WHERE score >= 80`) as { c: number }[]
      const flashcardCount = await window.api.db.all(`SELECT COUNT(*) as c FROM flashcards`) as { c: number }[]
      const shadowingBest = await window.api.db.all(`SELECT MAX(match_score) as best FROM shadowing_sessions`) as { best?: number }[]
      const unlockedUnits = await window.api.db.all(`SELECT COUNT(*) as c FROM units WHERE unlocked = 1`) as { c: number }[]

      const checks: { key: string; condition: boolean; title: string; icon: string }[] = [
        { key: 'first_card', condition: (flashcardCount[0]?.c ?? 0) > 0, title: '🔥 First Flame', icon: '🔥' },
        { key: 'word_hoarder', condition: (wordCount[0]?.c ?? 0) >= 100, title: '📚 Word Hoarder', icon: '📚' },
        { key: 'sharpshooter', condition: (streak[0]?.streak ?? 0) >= 7, title: '🎯 Sharpshooter', icon: '🎯' },
        { key: 'mimic_master', condition: (shadowingBest[0]?.best ?? 0) >= 90, title: '🗣️ Mimic Master', icon: '🗣️' },
        { key: 'essay_writer', condition: (writingCount[0]?.c ?? 0) >= 5, title: '✍️ Essay Writer', icon: '✍️' },
        { key: 'daily_warrior', condition: (streak[0]?.streak ?? 0) >= 1, title: '⚔️ Daily Warrior', icon: '⚔️' },
        { key: 'tutor_fan', condition: (convCount[0]?.c ?? 0) >= 50, title: '💬 Tutor Fan', icon: '💬' },
        { key: 'speed_reader', condition: (lessonCount[0]?.c ?? 0) >= 10, title: '⚡ Speed Reader', icon: '⚡' },
        { key: 'b2_graduate', condition: (unlockedUnits[0]?.c ?? 0) >= 4, title: '🎓 B2 Graduate', icon: '🎓' },
        { key: 'c1_champion', condition: (unlockedUnits[0]?.c ?? 0) >= 8, title: '🏆 C1 Champion', icon: '🏆' },
      ]

      const newUnlocked: string[] = []
      for (const check of checks) {
        if (check.condition && !processedKeysRef.current.has(check.key)) {
          processedKeysRef.current.add(check.key)
          newUnlocked.push(check.key)
        }
      }

      if (newUnlocked.length > 0) {
        for (const key of newUnlocked) {
          const check = checks.find(c => c.key === key)!
          await window.api.db.run(
            `INSERT INTO achievements (key, title, description, icon, unlocked_at)
             VALUES (?, ?, 'Achievement unlocked!', ?, datetime('now'))
             ON CONFLICT(key) DO NOTHING`,
            [check.key, check.title, check.icon]
          ).catch(() => {})
          addToast(`🏅 ${check.title} — Achievement Unlocked!`, check.icon)
          setAchievements(prev => [...prev, check.key])
        }
      }
    }

    const interval = setInterval(checkAchievements, 5000)
    checkAchievements()
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
            <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/flashcards" element={<ErrorBoundary><Flashcards /></ErrorBoundary>} />
            <Route path="/listening" element={<ErrorBoundary><Listening /></ErrorBoundary>} />
            <Route path="/reading" element={<ErrorBoundary><Reading /></ErrorBoundary>} />
            <Route path="/shadowing" element={<ErrorBoundary><Shadowing /></ErrorBoundary>} />
            <Route path="/speaking" element={<ErrorBoundary><Speaking /></ErrorBoundary>} />
            <Route path="/writing" element={<ErrorBoundary><Writing /></ErrorBoundary>} />
            <Route path="/news" element={<ErrorBoundary><News /></ErrorBoundary>} />
            <Route path="/podcasts" element={<ErrorBoundary><Podcasts /></ErrorBoundary>} />
            <Route path="/tutor" element={<ErrorBoundary><AITutor /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            <Route path="/youtube" element={<ErrorBoundary><YouTube /></ErrorBoundary>} />
            <Route path="/import" element={<ErrorBoundary><Import /></ErrorBoundary>} />
            <Route path="/stats" element={<ErrorBoundary><Stats /></ErrorBoundary>} />
            <Route path="/learning" element={<ErrorBoundary><Learning /></ErrorBoundary>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <SharedToastContainer />
      </div>
    </HashRouter>
  )
}

// touched
