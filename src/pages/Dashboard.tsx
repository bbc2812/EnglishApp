export default function Dashboard(): JSX.Element {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
      <p className="text-gray-400 text-sm mb-8">Your learning roadmap and daily progress</p>

      {/* Placeholder roadmap */}
      <div className="card flex items-center justify-center h-64 text-gray-600 text-sm">
        Roadmap — coming in Phase 5
      </div>

      {/* Daily stats row */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Words Reviewed', value: '—' },
          { label: 'New Words', value: '—' },
          { label: 'Streak', value: '0 days' },
          { label: 'Today\'s XP', value: '0' }
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
