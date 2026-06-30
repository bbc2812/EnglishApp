import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Howl } from 'howler'
import { useNavigate } from 'react-router-dom'
import { ShadowingPlayer } from '../components/ShadowingPlayer'
import { TranscriptionSentence } from '../hooks/useShadowing'

interface PodcastEpisode {
  id: number
  title: string
  source: string
  duration: string
  transcript: { sentence: string; translation: string; startTime: number; endTime: number }[]
  audioUrl: string
}

type SubtitleMode = 'en' | 'en-vn' | 'vn'

const MOCK_EPISODES: PodcastEpisode[] = [
  {
    id: 1,
    title: 'The Future of AI in Education',
    source: 'BBC 6 Minute English',
    duration: '6:12',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    transcript: [
      { sentence: 'Artificial intelligence is transforming education.', translation: 'Trí tuệ nhân tạo đang cách mạng hóa giáo dục.', startTime: 0, endTime: 4 },
      { sentence: 'Teachers can now use AI to personalize learning for each student.', translation: 'Giáo viên giờ có thể sử dụng AI để cá nhân hóa việc học cho mỗi học sinh.', startTime: 4, endTime: 9 },
      { sentence: 'Some experts worry about over-reliance on technology.', translation: 'Một số chuyên gia lo lắng về việc phụ thuộc quá nhiều vào công nghệ.', startTime: 9, endTime: 14 },
      { sentence: 'However, most agree that AI is a powerful tool when used responsibly.', translation: 'Tuy nhiên, hầu hết đồng ý rằng AI là công cụ mạnh mẽ khi được sử dụng có trách nhiệm.', startTime: 14, endTime: 20 },
      { sentence: 'The key is finding the right balance between human and machine.', translation: 'Chìa khóa là tìm sự cân bằng đúng giữa con người và máy móc.', startTime: 20, endTime: 26 },
    ]
  },
  {
    id: 2,
    title: 'Climate Change and Young Activists',
    source: 'VOA Learning English',
    duration: '5:45',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    transcript: [
      { sentence: 'Young people around the world are speaking up about climate change.', translation: 'Thanh thiếu niên trên khắp thế giới đang lên tiếng về biến đổi khí hậu.', startTime: 0, endTime: 5 },
      { sentence: 'They believe that adults have not done enough to protect the planet.', translation: 'Họ tin rằng người lớn chưa làm đủ để bảo vệ hành tinh.', startTime: 5, endTime: 10 },
      { sentence: 'Protests and strikes have become common ways to express frustration.', translation: 'Các cuộc biểu tình và đình công đã trở thành cách phổ biến để thể hiện sự bất mãn.', startTime: 10, endTime: 16 },
      { sentence: 'Scientists say the window for action is closing rapidly.', translation: 'Các nhà khoa học nói rằng cửa sổ hành động đang đóng lại nhanh chóng.', startTime: 16, endTime: 22 },
    ]
  },
  {
    id: 3,
    title: 'The Rise of Remote Work',
    source: 'BBC Learning English',
    duration: '4:30',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    transcript: [
      { sentence: 'Remote work has become the new normal for millions of people.', translation: 'Làm việc từ xa đã trở thành bình thường mới cho hàng triệu người.', startTime: 0, endTime: 5 },
      { sentence: 'Companies report increased productivity and happier employees.', translation: 'Các công ty báo cáo tăng năng suất và nhân viên hạnh phúc hơn.', startTime: 5, endTime: 10 },
      { sentence: 'But the challenge remains of maintaining team culture and collaboration.', translation: 'Nhưng thách thức vẫn là duy trì văn hóa nhóm và cộng tác.', startTime: 10, endTime: 16 },
    ]
  }
]

function ClickableWord({ word, onWordClick }: { word: string; onWordClick: (w: string) => void }) {
  const isWord = /^[a-zA-Z'-]+$/.test(word) && word.length > 1
  if (!isWord) return <span>{word}</span>
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onWordClick(word) }}
      className="cursor-pointer hover:text-brand-400 hover:bg-brand-950/30 px-0.5 rounded transition-colors inline"
    >
      {word}
    </span>
  )
}

function SubtitleLine({ sentence, translation, isActive, onClick, onWordClick }: {
  sentence: string
  translation: string
  isActive: boolean
  onClick: () => void
  onWordClick: (w: string) => void
}) {
  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 rounded-lg cursor-pointer transition-all ${
        isActive
          ? 'bg-brand-950/40 border-l-2 border-brand-400'
          : 'hover:bg-gray-800/50'
      }`}
    >
      <p className={`text-sm ${isActive ? 'text-white font-medium' : 'text-gray-300'} selectable`}>
        {sentence.split(' ').map((w, i) => (
          <ClickableWord key={i} word={w} onWordClick={onWordClick} />
        ))}
      </p>
      <p className={`text-xs mt-1 ${isActive ? 'text-brand-400' : 'text-gray-500'} selectable`}>
        {translation}
      </p>
    </div>
  )
}

function AudioPlayer({ episode, onWordClick }: { episode: PodcastEpisode; onWordClick: (word: string) => void }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('en-vn')
  const [loopSentence, setLoopSentence] = useState<number | null>(null)
  const soundRef = useRef<Howl | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const togglePlay = () => {
    if (!soundRef.current) return
    if (playing) soundRef.current.pause()
    else soundRef.current.play()
  }

  const skip = (s: number) => {
    if (!soundRef.current) return
    soundRef.current.seek(soundRef.current.seek() + s)
  }

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!soundRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    soundRef.current.seek(x * (soundRef.current.duration() || 0))
  }

  const changeSpeed = (r: number) => {
    setSpeed(r)
    if (soundRef.current) soundRef.current.rate(r)
  }

  const playSentence = (index: number) => {
    const t = episode.transcript[index]
    if (soundRef.current) {
      soundRef.current.seek(t.startTime)
      if (!playing) {
        soundRef.current.play()
        setPlaying(true)
      }
      setLoopSentence(index)
      setTimeout(() => setLoopSentence(null), 5000)
    }
  }

  useEffect(() => {
    if (!episode.audioUrl) return
    soundRef.current = new Howl({
      src: [episode.audioUrl],
      volume: 0.8,
      rate: speed,
      onend: () => { setPlaying(false); setProgress(100) },
      onplay: () => {
        setPlaying(true)
        intervalRef.current = setInterval(() => {
          if (soundRef.current) {
            const curr = soundRef.current.seek() as number
            const dur = soundRef.current.duration() || 1
            setCurrentTime(curr)
            setProgress((curr / dur) * 100)
          }
        }, 500)
      },
      onpause: () => { setPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current) }
    })
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [episode.audioUrl])

  const activeTranscriptIndex = episode.transcript.findIndex(
    t => currentTime >= t.startTime && currentTime < t.endTime
  )

  return (
    <div className="card p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 flex items-center justify-center text-white">
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={() => skip(-10)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800">-10s</button>
        <button onClick={() => skip(10)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800">+10s</button>

        <div className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer" onClick={seekTo}>
          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Speed + Subtitle toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Speed:</span>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
            <button key={s} onClick={() => changeSpeed(s)}
              className={`text-xs px-2 py-0.5 rounded ${speed === s ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
              {s}x
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 border-l border-gray-700 pl-3">
          <span className="text-xs text-gray-500">Subs:</span>
          {(['en', 'en-vn', 'vn'] as SubtitleMode[]).map(m => (
            <button key={m} onClick={() => setSubtitleMode(m)}
              className={`text-xs px-2 py-0.5 rounded ${subtitleMode === m ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Subtitles */}
      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
        {episode.transcript.map((t, i) => {
          const isActive = i === activeTranscriptIndex || i === loopSentence
          if (subtitleMode === 'en' && !isActive) return null
          if (subtitleMode === 'vn' && isActive) return null
          return (
            <div key={i} onClick={() => playSentence(i)}
              className={`px-2 py-1 rounded cursor-pointer text-sm transition-all ${
                isActive ? 'bg-brand-950/40 text-white font-medium' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {subtitleMode !== 'vn' && <span className="selectable">{t.sentence.split(' ').map((w, j) => <ClickableWord key={j} word={w} onWordClick={onWordClick} />)}</span>}
              {subtitleMode === 'en-vn' && <span className="text-brand-400 text-xs selectable">| {t.translation.split(' ').map((w, j) => <ClickableWord key={j} word={w} onWordClick={onWordClick} />)}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Podcasts(): JSX.Element {
  const navigate = useNavigate()
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(null)
  const [loading, setLoading] = useState(true)
  const [episodeList, setEpisodeList] = useState<PodcastEpisode[]>([])
  const [showShadowing, setShowShadowing] = useState(false)

  const handleWordClick = useCallback((word: string) => {
    const el = document.createElement('span')
    el.textContent = word
    document.body.appendChild(el)
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    document.body.removeChild(el)
  }, [])

  useEffect(() => {
    setTimeout(() => {
      setEpisodeList(MOCK_EPISODES)
      setLoading(false)
    }, 500)
  }, [])

  const shadowingSentences: TranscriptionSentence[] = selectedEpisode
    ? selectedEpisode.transcript.map(t => ({
        text: t.sentence,
        translation: t.translation,
        startTime: t.startTime,
        endTime: t.endTime
      }))
    : []

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Podcasts</h2>
          <p className="text-gray-400 text-sm mt-1">Listen with dual subtitles (EN / VN)</p>
        </div>
        {!selectedEpisode && !showShadowing && (
          <button onClick={() => navigate('/')} className="btn-secondary px-4 py-2 text-sm">← Back</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showShadowing ? (
          <motion.div key="shadowing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <ShadowingPlayer
              sentences={shadowingSentences}
              episodeType="podcast"
              episodeId={selectedEpisode?.id.toString() || ''}
              audioUrl={selectedEpisode?.audioUrl}
              onClose={() => setShowShadowing(false)}
            />
          </motion.div>
        ) : !selectedEpisode ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {loading ? (
              <div className="card flex items-center justify-center h-48 text-gray-500">Loading episodes…</div>
            ) : (
              episodeList.map((ep, i) => (
                <motion.button
                  key={ep.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedEpisode(ep)}
                  className="card w-full text-left p-5 hover:border-brand-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold">{ep.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{ep.source} · {ep.duration}</p>
                      <p className="text-xs text-gray-600 mt-1">{ep.transcript.length} sentences · Dual subtitles</p>
                    </div>
                    <span className="text-2xl">🎙️</span>
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div key="player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Player */}
            <AudioPlayer episode={selectedEpisode} onWordClick={handleWordClick} />

            {/* Full transcript */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-300">Full Transcript</h4>
              </div>
              <div className="space-y-2">
                {selectedEpisode.transcript.map((t, i) => (
                  <SubtitleLine
                    key={i}
                    sentence={t.sentence}
                    translation={t.translation}
                    isActive={false}
                    onClick={() => {}}
                    onWordClick={handleWordClick}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setSelectedEpisode(null)} className="btn-secondary px-5 py-2.5 text-sm">← All Episodes</button>
              <button onClick={() => setShowShadowing(true)} className="btn-primary px-5 py-2.5 text-sm">🎤 Shadow This (Learn/Free Mode)</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
