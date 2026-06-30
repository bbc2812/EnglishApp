import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSettingsStore } from '../store/settingsStore'
import { useProgressStore } from '../store/progressStore'
import { ShadowingPlayer } from '../components/ShadowingPlayer'
import { TranscriptionSentence } from '../hooks/useShadowing'

interface ArticleData {
  title: string
  description: string
  content: string
  url: string
}

export default function Import(): JSX.Element {
  const { newsApiKey, activeProvider } = useSettingsStore()
  const { setTodayXP } = useProgressStore()
  const [url, setUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [summary, setSummary] = useState('')
  const [b1Text, setB1Text] = useState('')
  const [b2Text, setB2Text] = useState('')
  const [c1Text, setC1Text] = useState('')
  const [activeLevel, setActiveLevel] = useState<'original' | 'B1' | 'B2' | 'C1'>('original')
  const [startReading, setStartReading] = useState(false)
  const [startTimestamp, setStartTimestamp] = useState<number>(0)
  const [wordsRead, setWordsRead] = useState(0)
  const [comprehensionScore, setComprehensionScore] = useState(0)
  const [showShadowing, setShowShadowing] = useState(false)
  const [shadowingLevel, setShadowingLevel] = useState<'original' | 'B1' | 'B2' | 'C1'>('original')

  const handleImport = useCallback(async () => {
    if (!url.trim()) return
    setImporting(true)
    try {
      const data = await window.api.content.scrapeUrl(url) as { title: string; description: string; content: string }
      setArticle({ ...data, url })
      setActiveLevel('original')

      // Generate summary
      try {
        const s = await window.api.ai.summarizeContent(data.content, { apiKey: newsApiKey, provider: activeProvider })
        setSummary(s)
      } catch { setSummary('AI summary unavailable — set your API key in Settings.') }

      // Generate 3-level adaptations
      try {
        const b1 = await window.api.ai.adaptArticle(data.content, 'B1', { apiKey: newsApiKey, provider: activeProvider })
        setB1Text(b1)
      } catch { /* ignore */ }
      try {
        const b2 = await window.api.ai.adaptArticle(data.content, 'B2', { apiKey: newsApiKey, provider: activeProvider })
        setB2Text(b2)
      } catch { /* ignore */ }
      try {
        const c1 = await window.api.ai.adaptArticle(data.content, 'C1', { apiKey: newsApiKey, provider: activeProvider })
        setC1Text(c1)
      } catch { /* ignore */ }
    } catch {
      setArticle({ title: 'Error', description: 'Could not fetch content', content: '', url })
    }
    setImporting(false)
  }, [url, newsApiKey, activeProvider])

  const handleStartReading = useCallback(() => {
    setStartReading(true)
    setStartTimestamp(Date.now())
    setWordsRead(0)
    setTodayXP(5)
  }, [setTodayXP])

  const handleReadingComplete = useCallback(() => {
    const elapsed = (Date.now() - startTimestamp) / 1000 / 60 // minutes
    const wpm = elapsed > 0 ? Math.round(wordsRead / elapsed) : 0

    // Calculate comprehension score (simulated)
    setComprehensionScore(Math.min(100, Math.max(50, Math.round(wpm / 4 + 30))))

    // Save to DB
    if (article) {
      window.api.db.run(
        `INSERT INTO saved_articles (url, title, source, content, summary, reading_mins, comprehension_score, saved_at)
         VALUES (?, ?, 'Imported', ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(url) DO UPDATE SET
           title = ?, content = ?, summary = ?, reading_mins = ?, comprehension_score = ?`,
        [url, article.title, article.content, summary, Math.max(elapsed, 0.1), comprehensionScore,
         article.title, article.content, summary, Math.max(elapsed, 0.1), comprehensionScore]
      ).catch(() => {})
    }
    setStartReading(false)
  }, [startTimestamp, wordsRead, article, url])

  const currentContent = activeLevel === 'original' ? article?.content || '' :
    activeLevel === 'B1' ? b1Text :
    activeLevel === 'B2' ? b2Text : c1Text

  const wordCount = currentContent.split(/\s+/).filter(Boolean).length

  const parseSentences = useCallback((text: string, _level: string) => {
    const sentences: TranscriptionSentence[] = []
    const raw = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text]
    let timeOffset = 0
    raw.forEach((s) => {
      const trimmed = s.trim()
      if (trimmed.length < 5) return
      const startTime = timeOffset
      const sentenceDuration = Math.max(2, trimmed.split(/\s+/).length * 0.5)
      const endTime = startTime + sentenceDuration
      sentences.push({
        text: trimmed,
        translation: undefined,
        startTime,
        endTime,
      })
      timeOffset = endTime
    })
    return sentences
  }, [])

  const shadowingSentences = useMemo(() => {
    if (!article) return []
    const text = shadowingLevel === 'original' ? article.content || '' :
      shadowingLevel === 'B1' ? b1Text :
      shadowingLevel === 'B2' ? b2Text : c1Text
    return parseSentences(text, shadowingLevel)
  }, [article, b1Text, b2Text, c1Text, shadowingLevel, parseSentences])

  // Simulate reading progress
  useEffect(() => {
    if (!startReading || !currentContent) return
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTimestamp) / 1000 / 60
      setWordsRead(Math.round(elapsed * 200))
    }, 3000)
    return () => clearInterval(timer)
  }, [startReading, currentContent, startTimestamp])

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Import Content</h2>
      <p className="text-gray-400 text-sm mt-1">Paste any URL — get AI summary, 3-level adaptation, and reading analytics</p>

      {/* URL Input */}
      <div className="card p-5 mt-6">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/article..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={handleImport}
            disabled={importing || !url.trim()}
            className="btn-primary px-6 py-3 disabled:opacity-40"
          >
            {importing ? '⏳ Importing…' : '📥 Import'}
          </button>
        </div>
      </div>

      {article && !startReading && !showShadowing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
          {/* Article info */}
          <div className="card p-5">
            <h3 className="text-xl font-bold text-white mb-2">{article.title}</h3>
            {article.description && <p className="text-gray-400 text-sm mb-3">{article.description}</p>}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs bg-brand-950/50 text-brand-300 px-2 py-0.5 rounded">AI Summary</span>
              <span className="text-xs bg-purple-950/50 text-purple-300 px-2 py-0.5 rounded">B1 Adaptation</span>
              <span className="text-xs bg-cyan-950/50 text-cyan-300 px-2 py-0.5 rounded">B2 Adaptation</span>
              <span className="text-xs bg-amber-950/50 text-amber-300 px-2 py-0.5 rounded">C1 Adaptation</span>
            </div>
            <div className="flex gap-2 mb-4">
              {(['original', 'B1', 'B2', 'C1'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${
                    activeLevel === level ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {level === 'original' ? 'Original' : level}
                </button>
              ))}
            </div>
            {summary && (
              <div className="p-3 bg-gray-800/50 rounded-lg mb-4">
                <p className="text-xs text-gray-500 mb-1">📋 Summary</p>
                <p className="text-sm text-gray-300 selectable whitespace-pre-line">{summary}</p>
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleStartReading} className="btn-primary px-6 py-2.5 text-sm">
                📖 Start Reading ({wordCount} words)
              </button>
              <button
                onClick={() => setShowShadowing(true)}
                className="btn-secondary px-6 py-2.5 text-sm"
              >
                🎤 Practice Shadowing
              </button>
              <button
                onClick={() => {
                  window.open(url, '_blank')
                }}
                className="btn-secondary px-6 py-2.5 text-sm"
              >
                🔗 Open Original
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {startReading && currentContent && !showShadowing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {(['original', 'B1', 'B2', 'C1'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setActiveLevel(level)}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                      activeLevel === level ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {level === 'original' ? 'Original' : level}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 text-sm text-gray-400">
                <span>{wordsRead} words</span>
                <span>{Math.round(wordsRead / ((Date.now() - startTimestamp) / 1000 / 60 || 1))} WPM</span>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-2 selectable text-gray-300 text-sm leading-relaxed">
              {currentContent.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} className="mb-3">{p}</p>
              ))}
            </div>
            <div className="mt-4 flex gap-3 justify-between items-center">
              <button
                onClick={() => setShowShadowing(true)}
                className="btn-secondary px-5 py-2.5 text-sm"
              >
                🎤 Shadowing
              </button>
              <div>
                <button
                  onClick={handleReadingComplete}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  ✅ Done Reading
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {startReading && showShadowing && shadowingSentences.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShadowing(false)}
              className="btn-secondary px-4 py-2 text-sm"
            >
              ← Back to Reading
            </button>
            <div className="flex gap-2">
              {(['original', 'B1', 'B2', 'C1'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setShadowingLevel(level)}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${
                    shadowingLevel === level ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {level === 'original' ? 'Original' : level}
                </button>
              ))}
            </div>
          </div>
          <ShadowingPlayer
            sentences={shadowingSentences}
            episodeType="imported_article"
            episodeId={article?.url || 'imported'}
            onClose={() => setShowShadowing(false)}
          />
        </motion.div>
      )}

      {startReading && showShadowing && shadowingSentences.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
          <div className="card p-6 text-center">
            <p className="text-gray-400 mb-2">No content available for shadowing yet.</p>
            <p className="text-gray-600 text-sm mb-4">Importing and generating adaptations may take a moment.</p>
            <button
              onClick={() => setShowShadowing(false)}
              className="btn-secondary px-6 py-2 text-sm"
            >
              ← Back to Reading
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
