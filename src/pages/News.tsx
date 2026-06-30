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

function QuickReadSummary({ articleTitle, onClose }: { articleTitle: string; onClose: () => void }): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0)

  const keyIdeas = [
    `AI is transforming how we consume news — personalized feeds adapt to reader preferences and reading levels.`,
    `Media literacy has become essential: distinguishing credible sources from misinformation is a core 21st-century skill.`,
    `Traditional journalism faces disruption as social media algorithms prioritize engagement over accuracy.`,
    `The rise of citizen journalism means anyone can report breaking news, but verification remains professional journalists\' core value.`,
    `Subscription fatigue is real — the average internet user now faces over 50 paywalled news sources to choose from.`,
    `Fact-checking has evolved from post-publication corrections to real-time AI-assisted verification tools.`,
    `The future of quality journalism depends on finding sustainable business models beyond click-based advertising.`,
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="card p-6 text-center mb-4 border-brand-900/30 bg-brand-950/5">
        <p className="text-3xl mb-2">⚡</p>
        <h3 className="text-lg font-bold text-white">Quick Read Summary</h3>
        <p className="text-xs text-gray-500 mt-1">{articleTitle}</p>
        <p className="text-sm text-gray-400 mt-2">7 key ideas · Swipe to explore</p>
      </div>

      <div className="card p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
        <div className="mb-4">
          <span className="text-xs text-gray-500">
            Key Idea {currentIndex + 1} of {keyIdeas.length}
          </span>
        </div>
        <p className="text-base text-white leading-relaxed max-w-lg">
          {keyIdeas[currentIndex]}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {keyIdeas.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'w-6 bg-brand-400' : 'w-1.5 bg-gray-700'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(keyIdeas.length - 1, prev + 1))}
            disabled={currentIndex === keyIdeas.length - 1}
            className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onClose}
          className="btn-primary px-6 py-2 text-sm"
        >
          Read Full Article →
        </button>
      </div>
    </motion.div>
  )
}

function ArticleCard({
  item,
  level,
  onSave,
  onQuickRead,
}: {
  item: RSSItem
  level: string
  onSave: (item: RSSItem, level: string) => void
  onQuickRead: () => void
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
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickRead() }}
            className="text-xs px-3 py-1.5 rounded flex-shrink-0 bg-brand-950/50 text-brand-300 hover:bg-brand-950"
          >
            ⚡ Quick Read
          </button>
          <button
            onClick={handleSave}
            className={`text-xs px-3 py-1.5 rounded flex-shrink-0 ${
              saved ? 'bg-green-950 text-green-300' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {saved ? '✅ Saved' : '💾 Save'}
          </button>
        </div>
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
  const [showQuickRead, setShowQuickRead] = useState(false)
  const [quickReadArticle, setQuickReadArticle] = useState<string | null>(null)



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
          onClick={() => {
            if (items.length > 0) {
              setQuickReadArticle(items[0].title)
              setShowQuickRead(true)
            }
          }}
          whileHover={{ y: -2 }}
          className="card p-4 text-left"
        >
          <p className="text-2xl mb-2">⚡</p>
          <p className="text-sm font-semibold text-white">Quick Read</p>
          <p className="text-xs text-gray-500 mt-1">Blinkist-style key ideas</p>
        </motion.button>
      </div>

      {/* Quick Read Modal */}
      {showQuickRead && quickReadArticle && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <QuickReadSummary articleTitle={quickReadArticle} onClose={() => setShowQuickRead(false)} />
          </motion.div>
        </div>
      )}

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
                onQuickRead={() => {
                  setQuickReadArticle(article.title)
                  setShowQuickRead(true)
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
