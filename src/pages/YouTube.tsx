import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useProgressStore } from '../store/progressStore'
import { ShadowingPlayer } from '../components/ShadowingPlayer'
import { TranscriptionSentence } from '../hooks/useShadowing'
import LearningBadge from '../components/LearningBadge'

interface Episode {
  videoId: string
  title: string
  channel: string
  publishedAt: string
  url: string
  transcript?: { text: string; startTime: number; endTime: number }[]
  level?: string
  learnt?: boolean
}

interface ChannelData {
  channel: string
  episodes: Episode[]
}

type FilterType = 'all' | 'learnt' | 'notlearnt'
type SortType = 'newest' | 'oldest' | 'level'

const YOUTUBE_CHANNELS = [
  { id: 'UCk-CP63XMk897PXXEhBizhw', name: 'BBC Learning English' },
  { id: 'UCwBnK6czOqJklP7QKXD6Q7g', name: 'VOA Learning English' },
  { id: 'UCsT0YIqwnpDLQM9kUhBflBw', name: 'TED' },
  { id: 'UCq-Ci6GMl1MBJCR3h1Ne4Aw', name: 'English with Lucy' },
  { id: 'UCJ6qMvjwEXhjoSNEV1jpfJA', name: 'mmmEnglish' },
  { id: 'UCvI5nZFolLpXpFPA3gAGUQg', name: 'English Addict with Mr Steve' },
]

const LEVELS: Record<string, string[]> = {
  'BBC Learning English': ['B1', 'B2'],
  'VOA Learning English': ['A2', 'B1'],
  'TED': ['B2', 'C1', 'C2'],
  'English with Lucy': ['B1', 'B2', 'C1'],
  'mmmEnglish': ['B1', 'B2'],
  'English Addict with Mr Steve': ['B1', 'B2'],
}

export default function YouTube(): JSX.Element {
  const { setTodayXP } = useProgressStore()
  const [channelId, setChannelId] = useState<string>('')
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [channelGroups, setChannelGroups] = useState<ChannelData[]>([])
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(false)
  const [showShadowing, setShowShadowing] = useState(false)
  const [showTranscriptInput, setShowTranscriptInput] = useState(false)
  const [manualTranscript, setManualTranscript] = useState('')
  const [parsedSentences, setParsedSentences] = useState<TranscriptionSentence[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('newest')
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set())
  const [usingDbEpisodes, setUsingDbEpisodes] = useState(false)

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setUsingDbEpisodes(false)
    if (!window.api?.content) { setLoading(false); return }
    try {
      const data = await window.api.content.fetchYouTubeRSS() as ChannelData[]
      if (data.length > 0 && data.some(g => g.episodes.length > 0)) {
        setChannelGroups(data)
      } else {
        // RSS returned empty, fallback to DB
        await loadDbEpisodes()
      }
    } catch {
      await loadDbEpisodes()
    }
    setLoading(false)
  }, [])

  const loadDbEpisodes = useCallback(async () => {
    if (!window.api?.db) return
    try {
      const dbEpisodes = await window.api.db.all(
        `SELECT video_id, title, channel, duration, published_at as publishedAt, level, transcript
         FROM youtube_episodes ORDER BY saved_at DESC`
      ) as { video_id: string; title: string; channel: string; duration?: string; publishedAt: string; level?: string; transcript?: string }[]

      const mapped = dbEpisodes.map(ep => ({
        videoId: ep.video_id,
        title: ep.title,
        channel: ep.channel,
        publishedAt: ep.publishedAt,
        url: `https://www.youtube.com/watch?v=${ep.video_id}`,
        level: ep.level,
        transcript: ep.transcript ? JSON.parse(ep.transcript) : undefined,
      }))
      setEpisodes(mapped)
      setChannelGroups([{ channel: 'All Saved Videos', episodes: mapped }])
      setUsingDbEpisodes(true)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const loadChannel = useCallback(async (id: string) => {
    setLoading(true)
    setUsingDbEpisodes(false)
    if (!window.api?.content) { setLoading(false); return }
    try {
      const data = await window.api.content.fetchYouTubeChannel(id) as Episode[]
      if (data.length > 0) {
        setEpisodes(data)
      } else {
        // RSS returned empty, fallback to DB for this channel
        await loadDbEpisodesForChannel(id)
      }
    } catch {
      await loadDbEpisodesForChannel(id)
    }
    setLoading(false)
  }, [])

  const loadDbEpisodesForChannel = useCallback(async (id: string) => {
    if (!window.api?.db) return
    const ch = YOUTUBE_CHANNELS.find(c => c.id === id)
    if (!ch) return
    try {
      const dbEpisodes = await window.api.db.all(
        `SELECT video_id, title, channel, duration, published_at as publishedAt, level
         FROM youtube_episodes WHERE channel = ? ORDER BY saved_at DESC`,
        [ch.name]
      ) as { video_id: string; title: string; channel: string; duration?: string; publishedAt: string; level?: string }[]

      const mapped = dbEpisodes.map(ep => ({
        videoId: ep.video_id,
        title: ep.title,
        channel: ep.channel,
        publishedAt: ep.publishedAt,
        url: `https://www.youtube.com/watch?v=${ep.video_id}`,
        level: ep.level,
      }))
      setEpisodes(mapped)
      setUsingDbEpisodes(true)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!channelId) refreshAll()
  }, [channelId, refreshAll])

  useEffect(() => {
    if (channelId) loadChannel(channelId)
  }, [channelId, loadChannel])

  const loadSubtitles = useCallback(async (videoId: string) => {
    if (!window.api?.content) return null
    try {
      const result = await window.api.content.fetchYouTubeSubtitles(videoId)
      if (result.sentences.length > 0) {
        return result.sentences
      }
    } catch { /* no auto captions */ }
    return null
  }, [])

  const handleSaveEpisode = async (ep: Episode) => {
    try {
      await window.api.content.saveYouTubeEpisode({
        videoId: ep.videoId,
        title: ep.title,
        channel: ep.channel,
        publishedAt: ep.publishedAt,
        level: LEVELS[ep.channel]?.[0] || 'B1',
      })
    } catch { /* ignore */ }
  }

  const handlePlay = async (ep: Episode) => {
    setSelectedEpisode(ep)
    setTodayXP(5)

    // Try loading subtitles
    if (!ep.transcript) {
      const subs = await loadSubtitles(ep.videoId)
      if (subs) {
        setSelectedEpisode(prev => prev ? { ...prev, transcript: subs } : null)
      }
    }
  }

  const handleParseManualTranscript = async () => {
    try {
      const parsed = await window.api.content.parseManualTranscript(manualTranscript) as { text: string; startTime: number; endTime: number }[]
      setParsedSentences(parsed.map(p => ({ ...p, translation: '' })))
      setShowTranscriptInput(false)
      setShowShadowing(true)
    } catch {
      // Fallback: split by lines
      const lines = manualTranscript.split('\n').filter(l => l.trim())
      setParsedSentences(lines.map((l, i) => ({
        text: l.trim(),
        translation: '',
        startTime: i * 3,
        endTime: (i + 1) * 3
      })))
      setShowTranscriptInput(false)
      setShowShadowing(true)
    }
  }

  const shadowingSentences: TranscriptionSentence[] = showShadowing && parsedSentences.length > 0
    ? parsedSentences
    : selectedEpisode?.transcript
      ? selectedEpisode.transcript.map(t => ({ ...t, translation: '' }))
      : []

  // Filter and sort episodes
  const filteredEpisodes = (() => {
    let allEpisodes: Episode[] = channelId
      ? episodes
      : channelGroups.flatMap(g => g.episodes.map(e => ({ ...e, channel: g.channel })))

    // Apply search
    if (search.trim()) {
      const s = search.toLowerCase()
      allEpisodes = allEpisodes.filter(e =>
        e.title.toLowerCase().includes(s) || e.channel.toLowerCase().includes(s)
      )
    }

    // Apply filter
    if (filter === 'learnt') {
      allEpisodes = allEpisodes.filter(e => e.learnt)
    } else if (filter === 'notlearnt') {
      allEpisodes = allEpisodes.filter(e => !e.learnt)
    }

    // Apply sort
    if (sortBy === 'newest') {
      allEpisodes.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    } else if (sortBy === 'oldest') {
      allEpisodes.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    }

    return allEpisodes.slice(0, 48)
  })()

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">YouTube</h2>
          <p className="text-gray-400 text-sm mt-1">English learning videos from top channels</p>
          <div className="mt-2 flex items-center gap-2">
            {usingDbEpisodes ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-950/50 text-amber-400 border border-amber-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Offline mode — {filteredEpisodes.length} saved videos
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-brand-950/50 text-brand-400 border border-brand-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                {filteredEpisodes.length} videos loaded
              </span>
            )}
          </div>
        </div>
        <button onClick={refreshAll} className="btn-primary px-4 py-2 text-sm">
          {loading ? '...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search videos..."
          className="flex-1 input-default"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as FilterType)}
          className="input-default w-36"
        >
          <option value="all">All</option>
          <option value="learnt">✅ Learnt</option>
          <option value="notlearnt">📝 Not Learnt</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortType)}
          className="input-default w-36"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Channel selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setChannelId('')}
          className={`px-3 py-1.5 rounded text-sm font-medium ${!channelId ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          All Channels
        </button>
        {YOUTUBE_CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setChannelId(ch.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium ${channelId === ch.id ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            {ch.name}
          </button>
        ))}
      </div>

      {/* Transcript input modal */}
      {showTranscriptInput && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8">
          <div className="card p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Paste Transcript</h3>
            <p className="text-sm text-gray-400 mb-4">
              Paste a transcript below. Supported formats: plain text (one sentence per line), or with timestamps
            </p>
            <textarea
              value={manualTranscript}
              onChange={e => setManualTranscript(e.target.value)}
              placeholder={"Artificial intelligence is transforming education.\nTeachers can now use AI to personalize learning."}
              className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white resize-none focus:border-brand-500 focus:outline-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setShowTranscriptInput(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button onClick={handleParseManualTranscript} className="btn-primary px-4 py-2 text-sm">🎤 Start Shadowing</button>
            </div>
          </div>
        </div>
      )}

      {/* Shadowing Player */}
      {showShadowing && shadowingSentences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <ShadowingPlayer
            sentences={shadowingSentences}
            episodeType="youtube"
            episodeId={selectedEpisode?.videoId || 'manual'}
            onClose={() => setShowShadowing(false)}
          />
        </motion.div>
      )}

      {/* Player */}
      {selectedEpisode && !showShadowing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-white font-semibold">{selectedEpisode.title}</h3>
              <p className="text-gray-500 text-xs">{selectedEpisode.channel}</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <LearningBadge
                type="video"
                itemId={selectedEpisode.videoId}
                itemTitle={selectedEpisode.title}
                source={selectedEpisode.channel}
                cefrLevel={LEVELS[selectedEpisode.channel]?.[0]}
              />
              <button
                onClick={() => handleSaveEpisode(selectedEpisode)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowTranscriptInput(true)}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                📝 Paste Transcript
              </button>
              <button
                onClick={() => {
                  const subs = selectedEpisode.transcript || []
                  if (subs.length > 0) {
                    setParsedSentences(subs.map(s => ({ ...s, translation: '' })))
                    setShowShadowing(true)
                  } else {
                    setShowTranscriptInput(true)
                  }
                }}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                🎤 Shadow
              </button>
              <button
                onClick={() => setSelectedEpisode(null)}
                className="text-gray-500 hover:text-white px-2"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden bg-black relative">
            <iframe
              src={`https://www.youtube.com/embed/${selectedEpisode.videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded text-xs text-brand-400 border border-brand-800/50">
              {usingDbEpisodes ? 'Saved video' : 'Playing'}
            </div>
          </div>
          {selectedEpisode.transcript && selectedEpisode.transcript.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-1">Captions ({selectedEpisode.transcript.length} sentences):</p>
              {selectedEpisode.transcript.slice(0, 10).map((t, i) => (
                <p key={i} className="text-xs text-gray-400">{t.text}</p>
              ))}
              {selectedEpisode.transcript.length > 10 && (
                <p className="text-xs text-gray-600 mt-1">...and {selectedEpisode.transcript.length - 10} more</p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Episode grid */}
      {loading && filteredEpisodes.length === 0 ? (
        <div className="card flex items-center justify-center h-48 text-gray-500">Loading episodes…</div>
      ) : filteredEpisodes.length === 0 ? (
        <div className="card flex items-center justify-center h-48 text-gray-500">
          No videos found. Try refreshing or selecting a different channel.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEpisodes.map((ep, i) => (
            <motion.button
              key={`${ep.videoId}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handlePlay(ep)}
              className={`card text-left hover:border-brand-500 transition-colors relative ${ep.learnt ? 'opacity-80 border-l-2 border-green-500/50' : ''}`}
            >
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 mb-3 relative">
                {failedThumbnails.has(ep.videoId) ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                    <div className="text-center">
                      <span className="text-4xl block mb-2">▶️</span>
                      <span className="text-xs text-gray-400">{ep.channel}</span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={`https://img.youtube.com/vi/${ep.videoId}/mqdefault.jpg`}
                    alt={ep.title}
                    className="w-full h-full object-cover"
                    onLoad={() => setFailedThumbnails(prev => { const next = new Set(prev); next.delete(ep.videoId); return next })}
                    onError={() => setFailedThumbnails(prev => new Set(prev).add(ep.videoId))}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-4xl drop-shadow-lg">▶️</span>
                </div>
              </div>
              <h4 className="text-white text-sm font-semibold line-clamp-2 mb-1">{ep.title}</h4>
              <p className="text-gray-500 text-xs">{ep.channel} · {new Date(ep.publishedAt).toLocaleDateString()}</p>
              {ep.level && (
                <span className="text-xs bg-brand-950/50 text-brand-400 px-1.5 py-0.5 rounded mt-1 inline-block">{ep.level}</span>
              )}
              {ep.transcript && ep.transcript.length > 0 && (
                <p className="text-xs text-brand-400 mt-1">📝 {ep.transcript.length} captions</p>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
