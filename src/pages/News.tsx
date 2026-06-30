import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProgressStore } from '../store/progressStore'

interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
  creator?: string
  'dc:date'?: string
}

interface Source {
  name: string
  url: string
  icon: string
}

const RSS_SOURCES: Source[] = [
  { name: 'BBC Learning English', url: 'http://feeds.bbci.co.uk/features/english_as_a_second_language/news.mp3', icon: '🇬🇧' },
  { name: 'VOA Learning English', url: 'https://learningenglish.voanews.com/api/rss/eng/voxpop', icon: '🇺🇸' },
  { name: 'BBC 6 Minute English', url: 'http://feeds.bbci.co.uk/modules/feeds/6minuteenglish.xml', icon: '🎙️' },
]

function LevelBadge({ level }: { level: string }): JSX.Element {
  const colors: Record<string, string> = {
    B1: 'bg-blue-900/40 text-blue-300',
    B2: 'bg-cyan-900/40 text-cyan-300',
    C1: 'bg-purple-900/40 text-purple-300',
    C2: 'bg-orange-900/40 text-orange-300',
  }
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors[level] || 'bg-gray-700 text-gray-300'}`}>
      {level}
    </span>
  )
}

function ArticleCard({
  item,
  level,
  onSave,
}: {
  item: RSSItem
  level: string
  onSave: (item: RSSItem, level: string) => void
}): JSX.Element {
  const [saved, setSaved] = useState(false)
  const date = new Date(item.pubDate || item['dc:date'] || 0).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await onSave(item, level)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => window.open(item.link, '_blank')}
      className="card text-left p-5 hover:border-brand-500 transition-colors block w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <LevelBadge level={level} />
            {item.creator && <span className="text-xs text-gray-500">by {item.creator}</span>}
          </div>
          <h4 className="text-white font-semibold text-sm leading-snug mb-2">{item.title}</h4>
          <p className="text-gray-500 text-xs line-clamp-2">{item.description?.replace(/<[^>]*>/g, '').substring(0, 120)}...</p>
          <p className="text-xs text-gray-600 mt-2">{date}</p>
        </div>
        <button
          onClick={handleSave}
          className={`text-xs px-3 py-1.5 rounded flex-shrink-0 ${
            saved ? 'bg-green-950 text-green-300' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          {saved ? '✅ Saved' : '💾 Save'}
        </button>
      </div>
    </motion.button>
  )
}

export default function News(): JSX.Element {
  const navigate = useNavigate()
  const { setTodayXP: _setTodayXP } = useProgressStore()
  const [items, setItems] = useState<RSSItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSource, setActiveSource] = useState<string>('all')
  const [saveCount, setSaveCount] = useState(0)



  const fetchAll = useCallback(async () => {
    setLoading(true)
    const allItems: RSSItem[] = []

    for (const source of RSS_SOURCES) {
      try {
        const feed = await window.api.content.fetchRss(source.url) as { feed?: { title?: string }; items?: RSSItem[] }
        if (feed?.items) {
          const filtered = feed.items.filter((_item, i) => i < 10)
          allItems.push(...filtered)
        }
      } catch {
        // RSS feed unavailable, skip
      }
    }

    allItems.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
    setItems(allItems)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleSave = async (item: RSSItem, level: string) => {
    try {
      await window.api.db.run(
        `INSERT INTO saved_articles (url, title, source, level, content, saved_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(url) DO UPDATE SET title = ?, source = ?, level = ?`,
        [item.link, item.title, activeSource === 'all' ? 'Multiple' : activeSource, level, item.description || '', item.title, activeSource === 'all' ? 'Multiple' : activeSource, level]
      )
      setSaveCount(prev => prev + 1)
    } catch { /* ignore */ }
  }

  const filteredItems = items.filter(item => {
    if (activeSource !== 'all' && !item.link.toLowerCase().includes(activeSource.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">News</h2>
          <p className="text-gray-400 text-sm mt-1">Real articles from BBC, VOA, and more</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setActiveSource('all'); fetchAll() }} className="btn-secondary px-3 py-1.5 text-xs">All</button>
          <button onClick={() => { setActiveSource('BBC'); fetchAll() }} className="btn-secondary px-3 py-1.5 text-xs">BBC</button>
          <button onClick={() => { setActiveSource('VOA'); fetchAll() }} className="btn-secondary px-3 py-1.5 text-xs">VOA</button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.button
          onClick={() => navigate('/podcasts')}
          whileHover={{ y: -2 }}
          className="card p-4 text-left"
        >
          <p className="text-2xl mb-2">🎙️</p>
          <p className="text-sm font-semibold text-white">Podcasts</p>
          <p className="text-xs text-gray-500 mt-1">Audio with dual subtitles</p>
        </motion.button>
        <motion.button
          onClick={() => navigate('/flashcards')}
          whileHover={{ y: -2 }}
          className="card p-4 text-left"
        >
          <p className="text-2xl mb-2">📝</p>
          <p className="text-sm font-semibold text-white">Saved Articles</p>
          <p className="text-xs text-gray-500 mt-1">{saveCount} saved this session</p>
        </motion.button>
        <motion.button
          onClick={() => navigate('/news')}
          whileHover={{ y: -2 }}
          className="card p-4 text-left"
        >
          <p className="text-2xl mb-2">📰</p>
          <p className="text-sm font-semibold text-white">Quick Read</p>
          <p className="text-xs text-gray-500 mt-1">AI summaries (coming soon)</p>
        </motion.button>
      </div>

      {/* Articles */}
      {loading ? (
        <div className="card flex items-center justify-center h-48 text-gray-500">Loading articles…</div>
      ) : (
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="card flex items-center justify-center h-48 text-gray-500">
              No articles found. Try a different source or check your internet connection.
            </div>
          ) : (
            filteredItems.map((article, i) => (
              <ArticleCard
                key={i}
                item={article}
                level={'B2'}
                onSave={handleSave}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
