import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', icon: '🗺️', label: 'Dashboard' },
  { to: '/flashcards', icon: '🃏', label: 'Flashcards' },
  { to: '/listening', icon: '🎧', label: 'Listening' },
  { to: '/reading', icon: '📖', label: 'Reading' },
  { to: '/shadowing', icon: '🎤', label: 'Shadowing' },
  { to: '/speaking', icon: '💬', label: 'Speaking' },
  { to: '/writing', icon: '✍️', label: 'Writing' },
  { to: '/news', icon: '📰', label: 'News' },
  { to: '/podcasts', icon: '🎙️', label: 'Podcasts' },
  { to: '/youtube', icon: '📺', label: 'YouTube' },
  { to: '/import', icon: '📥', label: 'Import' },
  { to: '/tutor', icon: '🤖', label: 'AI Tutor' },
]

function XPBar({ xp, level }: { xp: number; level: number }): JSX.Element {
  const nextLevelXp = level * 100
  const prevLevelXp = Math.max(0, (level - 1) * 100)
  const progress = Math.min(100, Math.max(0, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100))

  return (
    <div className="px-2 py-3 border-t border-gray-800">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Lvl {level}</span>
          <span className="text-xs text-gray-500">{xp}/{nextLevelXp} XP</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Sidebar(): JSX.Element {
  const [totalXp, setTotalXp] = useState(0)
  const [level, setLevel] = useState(1)

  useEffect(() => {
    const loadAllXP = async () => {
      let total = 0

      try {
        const writing = await window.api.db.all(`SELECT SUM(score || 0) as total_xp FROM writing_history`) as { total_xp?: number }[]
        total += (writing[0]?.total_xp || 0)
      } catch { /* ignore */ }

      try {
        const flashcardCount = await window.api.db.all(`SELECT COUNT(*) as c FROM flashcards`) as { c: number }[]
        total += (flashcardCount[0]?.c || 0) * 2
      } catch { /* ignore */ }

      try {
        const today = new Date().toISOString().slice(0, 10)
        const dailyStats = await window.api.db.all(`SELECT xp_earned FROM daily_stats WHERE date = ?`, [today]) as { xp_earned?: number }[]
        total += (dailyStats[0]?.xp_earned || 0)
      } catch { /* ignore */ }

      try {
        const userXp = await window.api.db.all(`SELECT total_xp FROM user_xp ORDER BY updated_at DESC LIMIT 1`) as { total_xp?: number }[]
        const storedXp = userXp[0]?.total_xp || 0
        if (storedXp > total) total = storedXp
      } catch { /* ignore */ }

      setTotalXp(total)
      setLevel(Math.floor(total / 100) + 1)
    }

    loadAllXP()
  }, [])

  return (
    <aside className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Wise<span className="text-brand-400">Rain</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">English to C1/C2</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Stats link */}
      <div className="px-2 py-1 border-t border-gray-800">
        <NavLink
          to="/stats"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="text-base leading-none">📊</span>
          <span>Stats</span>
        </NavLink>
      </div>

      {/* XP Bar */}
      <XPBar xp={totalXp} level={level} />

      {/* Settings at bottom */}
      <div className="px-2 py-3 border-t border-gray-800">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="text-base leading-none">⚙️</span>
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
