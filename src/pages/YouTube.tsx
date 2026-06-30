import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useProgressStore } from '../store/progressStore'
import { ShadowingPlayer } from '../components/ShadowingPlayer'
import { TranscriptionSentence } from '../hooks/useShadowing'

interface Episode {
  videoId: string
  title: string
  channel: string
  publishedAt: string
  url: string
  transcript?: { text: string; startTime: number; endTime: number }[]
}

interface ChannelData {
  channel: string
  episodes: Episode[]
}

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
  const [allLoaded, setAllLoaded] = useState(false)
  const [showShadowing, setShowShadowing] = useState(false)
  const [showTranscriptInput, setShowTranscriptInput] = useState(false)
  const [manualTranscript, setManualTranscript] = useState('')
  const [parsedSentences, setParsedSentences] = useState<TranscriptionSentence[]>([])

  const loadChannel = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const data = await window.api.content.fetchYouTubeChannel(id) as Episode[]
      setEpisodes(data)
    } catch {
      setEpisodes([])
    }
    setLoading(false)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.content.fetchYouTubeRSS() as ChannelData[]
      setChannelGroups(data)
      setAllLoaded(true)
    } catch {
      setChannelGroups([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!channelId) loadAll()
  }, [channelId, loadAll])

  useEffect(() => {
    if (channelId) loadChannel(channelId)
  }, [channelId, loadChannel])

  const loadSubtitles = useCallback(async (videoId: string) => {
    try {
      const subs = await window.api.content.fetchYouTubeSubtitles(videoId) as { text: string; startTime: number; endTime: number }[]
      if (subs.length > 0) {
        return subs
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

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">YouTube</h2>
          <p className="text-gray-400 text-sm mt-1">English learning videos from top channels</p>
        </div>
        {!allLoaded && (
          <button onClick={loadAll} className="btn-primary px-4 py-2 text-sm">
            Load All Channels
          </button>
        )}
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
              Paste a transcript below. Supported formats: plain text (one sentence per line), or with timestamps like [0:01] Text or 0:01 -&gt; 0:04 Text
            </p>
            <textarea
              value={manualTranscript}
              onChange={e => setManualTranscript(e.target.value)}
              placeholder={"Artificial intelligence is transforming education.\nTeachers can now use AI to personalize learning.\nSome experts worry about over-reliance on technology."}
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
            <div className="flex gap-2 flex-wrap">
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
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${selectedEpisode.videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
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
      {loading ? (
        <div className="card flex items-center justify-center h-48 text-gray-500">Loading episodes…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(channelId ? episodes : channelGroups.flatMap(g => g.episodes.map(e => ({ ...e, channel: g.channel }))))
            .slice(0, 24)
            .map((ep, i) => (
              <motion.button
                key={`${ep.videoId}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handlePlay(ep)}
                className="card text-left hover:border-brand-500 transition-colors"
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 mb-3 relative">
                  <img
                    src={`https://img.youtube.com/vi/${ep.videoId}/mqdefault.jpg`}
                    alt={ep.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">▶️</span>
                  </div>
                </div>
                <h4 className="text-white text-sm font-semibold line-clamp-2 mb-1">{ep.title}</h4>
                <p className="text-gray-500 text-xs">{ep.channel} · {new Date(ep.publishedAt).toLocaleDateString()}</p>
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
