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
  { to: '/tutor', icon: '🤖', label: 'AI Tutor' },
]

export default function Sidebar(): JSX.Element {
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
