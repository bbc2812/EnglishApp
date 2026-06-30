import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_LEARN = [
  { to: '/', icon: '🗺️', label: 'Dashboard' },
  { to: '/flashcards', icon: '🃏', label: 'Flashcards' },
  { to: '/listening', icon: '🎧', label: 'Listening' },
  { to: '/reading', icon: '📖', label: 'Reading' },
  { to: '/shadowing', icon: '🎤', label: 'Shadowing' },
]

const NAV_PRACTICE = [
  { to: '/speaking', icon: '🎙️', label: 'Speaking' },
  { to: '/writing', icon: '✍️', label: 'Writing' },
  { to: '/tutor', icon: '🤖', label: 'AI Tutor' },
]

const NAV_CONTENT = [
  { to: '/news', icon: '📰', label: 'News' },
  { to: '/podcasts', icon: '🎙️', label: 'Podcasts' },
  { to: '/youtube', icon: '📺', label: 'YouTube' },
  { to: '/import', icon: '📥', label: 'Import' },
]

function XPBar({ xp, level }: { xp: number; level: number }): JSX.Element {
  const nextLevelXp = level * 100
  const prevLevelXp = Math.max(0, (level - 1) * 100)
  const progress = Math.min(100, Math.max(0, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100))

  return (
    <div className="px-3 py-3 border-t border-gray-800/50">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1">
            <span className="text-amber-400">⚡</span>
            Lvl {level}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">{xp}/{nextLevelXp} XP</span>
        </div>
        <div className="xp-bar-bg">
          <div
            className="xp-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function NavSection({ title, items }: { title: string; items: typeof NAV_LEARN }) {
  return (
    <div className="mb-3">
      <p className="px-3 mb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
      <div className="space-y-0.5">
        {items.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="text-base leading-none w-5 text-center">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
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
    <aside className="w-52 flex-shrink-0 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800/50">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Wise<span className="text-brand-400">Rain</span>
        </h1>
        <p className="text-[10px] text-gray-600 mt-0.5 font-medium">English to C1/C2</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0 overflow-y-auto">
        <NavSection title="Learn" items={NAV_LEARN} />
        <NavSection title="Practice" items={NAV_PRACTICE} />
        <NavSection title="Content" items={NAV_CONTENT} />
      </nav>

      {/* XP Bar */}
      <XPBar xp={totalXp} level={level} />

      {/* Settings at bottom */}
      <div className="px-2 py-2 border-t border-gray-800/50">
        <NavLink
          to="/stats"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="text-base leading-none w-5 text-center">📊</span>
          <span>Stats</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="text-base leading-none w-5 text-center">⚙️</span>
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
