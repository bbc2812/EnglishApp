import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSettingsStore } from '../store/settingsStore'

interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: { name: string }
}

interface BBCLEItem {
  title: string
  description: string
  url: string
  imageUrl: string
  publishedAt: string
  type: string
  level: string
  audioUrl: string
  transcript: string
}

interface GuardianItem {
  id: string
  webTitle: string
  webUrl: string
  sectionName: string
  webPublicationDate: string
  pillarName: string
}

type TabType = 'all' | 'bbc' | 'guardian' | 'wotd' | 'quotes'

export default function News(): JSX.Element {
  const { newsApiKey } = useSettingsStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [bbcItems, setBbcItems] = useState<BBCLEItem[]>([])
  const [guardianItems, setGuardianItems] = useState<GuardianItem[]>([])
  const [wotd, setWotd] = useState<{ word: string; url: string } | null>(null)
  const [quotes, setQuotes] = useState<{ content: string; author: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const fetchNews = useCallback(async (category?: string) => {
    setLoading(true)
    if (!window.api?.content) { setLoading(false); return }
    try {
      const data = await window.api.content.fetchNewsAPI(category, newsApiKey) as NewsArticle[]
      setArticles(data)
    } catch { setArticles([]) }
    setLoading(false)
  }, [newsApiKey])

  const fetchBBCLE = useCallback(async () => {
    setLoading(true)
    if (!window.api?.content) { setLoading(false); return }
    try {
      const data = await window.api.content.fetchBBCLE('article') as BBCLEItem[]
      setBbcItems(data)
    } catch { setBbcItems([]) }
    setLoading(false)
  }, [])

  const fetchGuardian = useCallback(async () => {
    setLoading(true)
    if (!window.api?.content) { setLoading(false); return }
    try {
      const data = await window.api.content.fetchGuardianArticles() as GuardianItem[]
      setGuardianItems(data)
    } catch { setGuardianItems([]) }
    setLoading(false)
  }, [])

  const fetchWOTD = useCallback(async () => {
    if (!window.api?.content) return
    const data = await window.api.content.fetchWordOfTheDay() as { word: string; url: string } | null
    setWotd(data)
  }, [])

  const fetchQuotes = useCallback(async () => {
    if (!window.api?.content) return
    const data = await window.api.content.fetchQuotable(10) as { content: string; author: string }[]
    setQuotes(data)
  }, [])

  const loadTab = useCallback((tab: TabType) => {
    setActiveTab(tab)
    switch (tab) {
      case 'all':
        const categories = ['general', 'technology', 'science', 'business', 'sports']
        categories.forEach((c, i) => setTimeout(() => fetchNews(c), i * 200))
        break
      case 'bbc': fetchBBCLE() ; break
      case 'guardian': fetchGuardian() ; break
      case 'wotd': fetchWOTD() ; break
      case 'quotes': fetchQuotes() ; break
    }
  }, [fetchNews, fetchBBCLE, fetchGuardian, fetchWOTD, fetchQuotes])

  useEffect(() => { loadTab('all') }, [loadTab])

  const handleSave = async (item: { title: string; url: string; description?: string }) => {
    if (!window.api?.db) return
    await window.api.db.run(
      `INSERT INTO saved_articles (url, title, source, content, saved_at)
       VALUES (?, ?, 'News', ?, datetime('now'))
       ON CONFLICT(url) DO UPDATE SET title = ?`,
      [item.url, item.title, item.description || '', item.title]
    ).catch(() => {})
    setSavedCount(prev => prev + 1)
  }

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">News & Resources</h2>
          <p className="text-gray-400 text-sm mt-1">Auto-updating content from multiple sources</p>
        </div>
        <span className="text-xs text-gray-500">{savedCount} saved</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-lg w-fit">
        {([
          { id: 'all', label: '📰 All News' },
          { id: 'bbc', label: '🇬🇧 BBC LE' },
          { id: 'guardian', label: '📖 Guardian' },
          { id: 'wotd', label: '📝 Word of Day' },
          { id: 'quotes', label: '💬 Quotes' },
        ] as { id: TabType; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => loadTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <motion.button onClick={() => navigate('/youtube')} whileHover={{ y: -2 }} className="card p-4 text-left">
          <p className="text-2xl mb-2">📺</p>
          <p className="text-sm font-semibold text-white">YouTube</p>
          <p className="text-xs text-gray-500 mt-1">Video lessons</p>
        </motion.button>
        <motion.button onClick={() => navigate('/import')} whileHover={{ y: -2 }} className="card p-4 text-left">
          <p className="text-2xl mb-2">📥</p>
          <p className="text-sm font-semibold text-white">Import URL</p>
          <p className="text-xs text-gray-500 mt-1">AI summary</p>
        </motion.button>
        <motion.button onClick={() => navigate('/flashcards')} whileHover={{ y: -2 }} className="card p-4 text-left">
          <p className="text-2xl mb-2">🃏</p>
          <p className="text-sm font-semibold text-white">Flashcards</p>
          <p className="text-xs text-gray-500 mt-1">Study due words</p>
        </motion.button>
        <motion.button onClick={() => navigate('/stats')} whileHover={{ y: -2 }} className="card p-4 text-left">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm font-semibold text-white">Analytics</p>
          <p className="text-xs text-gray-500 mt-1">Track progress</p>
        </motion.button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="card flex items-center justify-center h-48 text-gray-500">Loading…</div>
      ) : activeTab === 'all' && (
        <div className="space-y-3">
          {articles.length === 0 ? (
            <div className="card flex items-center justify-center h-48 text-gray-500">
              No articles loaded. Check your NewsAPI key in Settings.
            </div>
          ) : (
            articles.slice(0, 20).map((article, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <ArticleCard article={article} onSave={handleSave} />
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'bbc' && (
        <div className="space-y-3">
          {bbcItems.length === 0 ? (
            <div className="card flex items-center justify-center h-48 text-gray-500">
              Could not load BBC Learning English. Content may be temporarily unavailable.
            </div>
          ) : (
            bbcItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <BBCLECard item={item} onSave={handleSave} />
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'guardian' && (
        <div className="space-y-3">
          {guardianItems.length === 0 ? (
            <div className="card flex items-center justify-center h-48 text-gray-500">
              No Guardian articles found.
            </div>
          ) : (
            guardianItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GuardianCard item={item} onSave={handleSave} />
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'wotd' && wotd && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-8 text-center">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Word of the Day</p>
          <h3 className="text-3xl font-bold text-white mb-2">{wotd.word}</h3>
          <a
            href={wotd.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-400 hover:text-brand-300"
          >
            🔗 Merriam-Webster Dictionary
          </a>
        </motion.div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {quotes.length === 0 ? (
            <div className="card flex items-center justify-center h-48 text-gray-500">
              Could not load quotes.
            </div>
          ) : (
            quotes.map((q, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="card p-5">
                  <p className="text-gray-300 text-sm leading-relaxed italic mb-2">"{q.content}"</p>
                  <p className="text-brand-400 text-xs text-right">— {q.author}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ArticleCard({ article, onSave }: { article: NewsArticle; onSave: (item: { title: string; url: string; description?: string }) => void }): JSX.Element {
  const [saved, setSaved] = useState(false)

  return (
    <motion.div
      onClick={() => window.open(article.url, '_blank')}
      className="card text-left p-5 hover:border-brand-500 transition-colors block w-full cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') window.open(article.url, '_blank') }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm leading-snug mb-2">{article.title}</h4>
          <p className="text-gray-500 text-xs line-clamp-2">{article.description?.replace(/<[^>]*>/g, '').substring(0, 120)}...</p>
          <p className="text-xs text-gray-600 mt-2">{new Date(article.publishedAt).toLocaleDateString()}</p>
          <span className="text-xs text-gray-500">• {article.source.name}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(article); setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          className={`text-xs px-3 py-1.5 rounded flex-shrink-0 ${saved ? 'bg-green-950 text-green-300' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          {saved ? '✅ Saved' : '💾 Save'}
        </button>
      </div>
    </motion.div>
  )
}

function BBCLECard({ item, onSave }: { item: BBCLEItem; onSave: (i: { title: string; url: string; description?: string }) => void }): JSX.Element {
  const [saved, setSaved] = useState(false)
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <CEFRLevel level={item.level || 'B1'} />
        <button onClick={(e) => { e.stopPropagation(); onSave(item); setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          className={`text-xs px-3 py-1.5 rounded flex-shrink-0 ${saved ? 'bg-green-950 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
          {saved ? '✅' : '💾'}
        </button>
      </div>
      <h4 className="text-white font-semibold text-sm">{item.title}</h4>
      <p className="text-gray-400 text-xs">{item.description?.substring(0, 150)}...</p>
      {item.audioUrl && (
        <audio src={item.audioUrl} controls className="w-full mt-2" />
      )}
      <button onClick={() => window.open(item.url, '_blank')} className="text-xs text-brand-400 hover:text-brand-300">
        Read full article →
      </button>
    </div>
  )
}

function GuardianCard({ item, onSave }: { item: GuardianItem; onSave: (i: { title: string; url: string; description?: string }) => void }): JSX.Element {
  const [saved, setSaved] = useState(false)
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{item.sectionName}</span>
        <button onClick={(e) => { e.stopPropagation(); onSave({ title: item.webTitle, url: item.webUrl }); setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          className={`text-xs px-3 py-1.5 rounded flex-shrink-0 ${saved ? 'bg-green-950 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
          {saved ? '✅' : '💾'}
        </button>
      </div>
      <h4 className="text-white font-semibold text-sm mb-1">{item.webTitle}</h4>
      <p className="text-xs text-gray-600">{new Date(item.webPublicationDate).toLocaleDateString()}</p>
      <button onClick={() => window.open(item.webUrl, '_blank')} className="text-xs text-brand-400 hover:text-brand-300 mt-2">
        Read on The Guardian →
      </button>
    </div>
  )
}

function CEFRLevel({ level }: { level: string }) {
  const colors: Record<string, string> = {
    A1: 'bg-green-900/40 text-green-300', A2: 'bg-blue-900/40 text-blue-300',
    B1: 'bg-cyan-900/40 text-cyan-300', B2: 'bg-green-900/40 text-green-300',
    C1: 'bg-purple-900/40 text-purple-300', C2: 'bg-orange-900/40 text-orange-300',
  }
  return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors[level] || 'bg-gray-700 text-gray-300'}`}>{level}</span>
}
