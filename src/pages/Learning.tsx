import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import LearningBadge from '../components/LearningBadge'

interface LearningItem {
  id: number
  type: string
  item_id: string
  item_title: string
  source: string | null
  cefr_level: string | null
  completed: number
  completed_at: string | null
  added_at: string
}

interface LightLearningItem {
  type: string
  item_id: string
  item_title: string
  source: string | null
  cefr_level: string | null
  completed_at: string | null
}

type ContentType = 'all' | 'video' | 'audio' | 'article' | 'lesson' | 'shadowing'
type CEFRLevel = 'all' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
type CompletionFilter = 'all' | 'learnt' | 'notlearnt'

const TYPE_ICONS: Record<string, string> = {
  video: '📺',
  audio: '🎙️',
  article: '📖',
  lesson: '📝',
  shadowing: '🎤'
}

export default function Learning(): JSX.Element {
  const [search, setSearch] = useState('')
  const [contentType, setContentType] = useState<ContentType>('all')
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('all')
  const [completed, setCompleted] = useState<CompletionFilter>('all')
  const [sortBy, setSortBy] = useState('newest')
  const [items, setItems] = useState<LearningItem[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<{
    total: number
    learnt: number
    todayLearnt: number
    thisWeekLearnt: number
    byType: { type: string; c: number }[]
  } | null>(null)
  const [recentLearnt, setRecentLearnt] = useState<LightLearningItem[]>([])
  const [loading, setLoading] = useState(true)
  const [grouped, setGrouped] = useState<{
    today: LightLearningItem[]
    thisWeek: LightLearningItem[]
    thisMonth: LightLearningItem[]
    allTime: LightLearningItem[]
  }>({ today: [], thisWeek: [], thisMonth: [], allTime: [] })

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    if (!window.api?.learning) { setLoading(false); return }
    try {
      const result = await window.api.learning.getHistory({
        search: search.trim(),
        type: contentType,
        cefrLevel,
        completed,
        sortBy,
        limit: 100
      })
      setItems(result.items)
      setTotal(result.total)
    } catch { /* ignore */ }
    setLoading(false)
  }, [search, contentType, cefrLevel, completed, sortBy])

  const fetchStats = useCallback(async () => {
    if (!window.api?.learning) return
    try {
      const statsResult = await window.api.learning.getStats()
      setStats(statsResult)
    } catch { /* ignore */ }
  }, [])

  const fetchRecent = useCallback(async () => {
    if (!window.api?.learning) return
    try {
      const recent = await window.api.learning.getRecent(20)
      setRecentLearnt(recent)
    } catch { /* ignore */ }
  }, [])

  const fetchByDate = useCallback(async () => {
    if (!window.api?.learning) return
    try {
      const groupedResult = await window.api.learning.getByDate()
      setGrouped(groupedResult)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchHistory()
    fetchStats()
    fetchRecent()
    fetchByDate()
  }, [fetchHistory, fetchStats, fetchRecent, fetchByDate])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchHistory()
    }, 300)
    return () => clearTimeout(timeout)
  }, [search, contentType, cefrLevel, completed, sortBy, fetchHistory])

  const formatTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">My Learning</h2>
        <p className="text-gray-400 text-sm">Track everything you've learnt across all content types</p>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or source..."
              className="w-full input-default"
            />
          </div>

          {/* Filters */}
          <select
            value={contentType}
            onChange={e => setContentType(e.target.value as ContentType)}
            className="input-default w-full md:w-36"
          >
            <option value="all">All Types</option>
            <option value="video">📺 Videos</option>
            <option value="audio">🎙️ Audio</option>
            <option value="article">📖 Articles</option>
            <option value="lesson">📝 Lessons</option>
            <option value="shadowing">🎤 Shadowing</option>
          </select>

          <select
            value={cefrLevel}
            onChange={e => setCefrLevel(e.target.value as CEFRLevel)}
            className="input-default w-full md:w-32"
          >
            <option value="all">All Levels</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>

          <select
            value={completed}
            onChange={e => setCompleted(e.target.value as CompletionFilter)}
            className="input-default w-full md:w-36"
          >
            <option value="all">All</option>
            <option value="learnt">✅ Learnt</option>
            <option value="notlearnt">📝 Not Learnt</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input-default w-full md:w-36"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="level">By Level</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Total Items</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">{stats?.learnt || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Learnt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-brand-400">{stats?.todayLearnt || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Today</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-400">{stats?.thisWeekLearnt || 0}</p>
          <p className="text-xs text-gray-500 mt-1">This Week</p>
        </div>
      </div>

      {/* Recent Learnt on Dashboard */}
      {recentLearnt.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Recently Learnt</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {recentLearnt.slice(0, 5).map((item, i) => (
              <motion.div
                key={item.item_id + item.completed_at}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-3 text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{TYPE_ICONS[item.type] || '📄'}</span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(item.completed_at)}</span>
                </div>
                <p className="text-sm text-white font-medium truncate">{item.item_title}</p>
                {item.source && <p className="text-[10px] text-gray-500">{item.source}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped by date */}
      <div className="space-y-6 mb-8">
        {grouped.today.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Today ({grouped.today.length})
            </h3>
            <div className="space-y-2">
              {grouped.today.map((item, i) => (
                <motion.div
                  key={item.item_id + item.completed_at}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICONS[item.type] || '📄'}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{item.item_title}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.source ?? '—'} · {item.cefr_level ?? '—'} · {formatTimeAgo(item.completed_at)}
                      </p>
                    </div>
                  </div>
                  <LearningBadge
                    type={item.type as 'video' | 'audio' | 'article' | 'lesson' | 'shadowing'}
                    itemId={item.item_id}
                    itemTitle={item.item_title}
                    source={item.source ?? undefined}
                    cefrLevel={item.cefr_level ?? undefined}
                    compact
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {grouped.thisWeek.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              This Week ({grouped.thisWeek.length})
            </h3>
            <div className="space-y-2">
              {grouped.thisWeek.map((item, i) => (
                <motion.div
                  key={item.item_id + item.completed_at}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICONS[item.type] || '📄'}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{item.item_title}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.source ?? '—'} · {item.cefr_level ?? '—'} · {formatTimeAgo(item.completed_at)}
                      </p>
                    </div>
                  </div>
                  <LearningBadge
                    type={item.type as 'video' | 'audio' | 'article' | 'lesson' | 'shadowing'}
                    itemId={item.item_id}
                    itemTitle={item.item_title}
                    source={item.source ?? undefined}
                    cefrLevel={item.cefr_level ?? undefined}
                    compact
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {grouped.thisMonth.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              This Month ({grouped.thisMonth.length})
            </h3>
            <div className="space-y-2">
              {grouped.thisMonth.map((item, i) => (
                <motion.div
                  key={item.item_id + item.completed_at}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICONS[item.type] || '📄'}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{item.item_title}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.source ?? '—'} · {item.cefr_level ?? '—'} · {formatTimeAgo(item.completed_at)}
                      </p>
                    </div>
                  </div>
                  <LearningBadge
                    type={item.type as 'video' | 'audio' | 'article' | 'lesson' | 'shadowing'}
                    itemId={item.item_id}
                    itemTitle={item.item_title}
                    source={item.source ?? undefined}
                    cefrLevel={item.cefr_level ?? undefined}
                    compact
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full filtered list */}
      {items.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Filtered Results ({total} items)</span>
          </h3>
          <div className="space-y-2">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`card p-3 flex items-center justify-between ${
                  item.completed ? 'opacity-80 border-l-2 border-green-500/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{TYPE_ICONS[item.type] || '📄'}</span>
                  <div>
                    <p className={`text-sm font-medium ${item.completed ? 'text-green-300' : 'text-white'}`}>
                      {item.item_title}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {item.source} · {item.cefr_level} · {formatTimeAgo(item.completed_at)}
                    </p>
                  </div>
                </div>
                <LearningBadge
                  type={item.type as 'video' | 'audio' | 'article' | 'lesson' | 'shadowing'}
                  itemId={item.item_id}
                  itemTitle={item.item_title}
                  source={item.source ?? undefined}
                  cefrLevel={item.cefr_level ?? undefined}
                  compact
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && total === 0 && (
        <div className="empty-state">
          <p className="empty-state-icon">📚</p>
          <p className="empty-state-text">
            {search || contentType !== 'all' || cefrLevel !== 'all' || completed !== 'all'
              ? 'No items match your filters. Try adjusting your search.'
              : 'No learning history yet. Mark items as learnt from any content page!'}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && items.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  )
}
