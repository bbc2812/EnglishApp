import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUnitProgress } from '../hooks/useUnitProgress'
import { useProgressStore } from '../store/progressStore'

interface Mistake {
  id: number
  type: string
  description: string
  count: number
  last_seen: string
}

interface WritingEntry {
  id: number
  content: string
  score: number | null
  created_at: string
}

const TOP_MISTAKES = [
  { id: 1, type: 'Missing Articles', description: 'I go to school → I go to **the** school', vn: 'Tiếng Việt không có mạo từ. Nhưng tiếng Anh cần a/an/the trước danh từ đếm được số ít.' },
  { id: 2, type: 'Verb Tense', description: 'I go to school yesterday → I **went** to school yesterday', vn: 'Trong tiếng Việt, động từ không thay đổi theo thì. Tiếng Anh bắt buộc dùng quá khứ đơn (went) khi nói về hành động đã hoàn thành.' },
  { id: 3, type: 'Subject-Verb Agreement', description: 'He play football → He **plays** football', vn: 'Ngôi thứ 3 số ít (he/she/it) cần thêm -s/-es vào động từ ở hiện tại đơn.' },
  { id: 4, type: 'Word Order', description: 'I very like coffee → I **like coffee very much**', vn: 'Trạng ngữ chỉ mức độ (very, quite, quite) đứng sau động từ hoặc trước tính từ, không đứng trước động từ.' },
  { id: 5, type: 'Preposition', description: 'I am good in English → I am good **at** English', vn: 'Giới từ trong tiếng Anh không dịch trực tiếp từ tiếng Việt. "Good at" = giỏi về một kỹ năng.' },
  { id: 6, type: 'Missing Progressive', description: 'I eat dinner now → I **am eating** dinner now', vn: 'Thì tiếp diễn (be + V-ing) cần khi hành động đang xảy ra tại thời điểm nói.' },
  { id: 7, type: 'Overuse of "Very"', description: 'very good → **excellent**, very big → **enormous**', vn: 'Thay vì dùng "very + adj", hãy dùng tính từ mạnh hơn để diễn đạt tự nhiên hơn.' },
  { id: 8, type: 'Literal Translation', description: 'I agree with you on → I **agree with you**', vn: '"Đồng ý với bạn" dịch word-by-word sai. Tiếng Anh: "agree with someone" (không có "on").' },
  { id: 9, type: 'Double Negatives', description: 'I don\'t know nothing → I **don\'t know anything** / I know **nothing**', vn: 'Tiếng Anh không dùng phủ định kép. Chọn một trong hai: don\'t + anything HOẶC know + nothing.' },
  { id: 10, type: 'Missing Plural -s', description: 'I have two book → I have two book**s**', vn: 'Danh từ đếm được sau số từ (>1) phải ở dạng số nhiều (thêm -s/-es).' },
]

const PROMPTS = [
  'Describe your daily routine and explain why it is important.',
  'What are the advantages and disadvantages of social media?',
  'If you could change one thing about your country, what would it be?',
  'Do you think technology makes people more isolated or more connected?',
  'Describe a book that had a significant impact on your life.',
]

function GrammarCorrection({ original, correction, explanation }: {
  original: string
  correction: string
  explanation: string
}) {
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-red-400 text-sm font-bold mt-0.5">❌</span>
        <p className="text-gray-400 text-sm line-through">{original}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-green-400 text-sm font-bold mt-0.5">✅</span>
        <p className="text-white text-sm">{correction}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-brand-400 text-sm font-bold mt-0.5">💬</span>
        <p className="text-gray-300 text-sm">{explanation}</p>
      </div>
    </div>
  )
}

export default function Writing(): JSX.Element {
  const { completeLesson: _completeLesson, checkAndUnlockNext: _checkAndUnlockNext } = useUnitProgress()
  const { setTodayXP } = useProgressStore()
  const [essay, setEssay] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [running, setRunning] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [corrections, setCorrections] = useState<{ original: string; correction: string; explanation: string }[]>([])
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [history, setHistory] = useState<WritingEntry[]>([])
  const [activeTab, setActiveTab] = useState<'write' | 'mistakes' | 'history'>('write')
  const [prompt, setPrompt] = useState(PROMPTS[0])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (running && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000)
    }
    return () => interval && clearInterval(interval)
  }, [running, timeLeft])

  const loadMistakes = useCallback(async () => {
    const rows = await window.api.db.all(
      `SELECT * FROM grammar_mistakes ORDER BY count DESC LIMIT 20`
    ) as Mistake[]
    setMistakes(rows)
  }, [])

  const loadHistory = useCallback(async () => {
    const rows = await window.api.db.all(
      `SELECT * FROM writing_history ORDER BY created_at DESC LIMIT 20`
    ) as WritingEntry[]
    setHistory(rows)
  }, [])

  useEffect(() => {
    loadMistakes()
    loadHistory()
  }, [loadMistakes, loadHistory])

  const simulateAnalysis = () => {
    // Simulate grammar analysis
    const fakeCorrections = [
      {
        original: 'I go to school every day by bus',
        correction: 'I **go** to school every day by bus',
        explanation: '✓ This sentence is actually correct! Present simple for routines.'
      },
      {
        original: 'I very like studying English',
        correction: 'I **like studying English very much**',
        explanation: 'Trạng từ "very" không đứng trước động từ. Dùng "very much" sau cụm động-từ.'
      }
    ]

    // Generate some fake corrections based on essay content
    const generatedCorrections = [...fakeCorrections]
    const words = essay.toLowerCase().split(/\s+/)

    if (words.includes('go') && words.includes('yesterday')) {
      generatedCorrections.push({
        original: 'I go ... yesterday',
        correction: 'I **went** ... yesterday',
        explanation: 'Thì quá khứ đơn (went) cần dùng khi có "yesterday". Động từ "go" → "went" ở thì quá khứ.'
      })
    }

    setCorrections(generatedCorrections)
    const fakeScore = Math.min(100, Math.max(40, 60 + Math.floor(Math.random() * 30)))
    setScore(fakeScore)
    setSubmitted(true)

    // Save to DB
    window.api.db.run(
      `INSERT INTO writing_history (prompt, content, score, created_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [prompt, essay, fakeScore]
    ).then(() => {
      setTodayXP(fakeScore >= 80 ? 15 : 10)
    }).catch(() => {})

    // Update grammar mistakes
    generatedCorrections.forEach(c => {
      const mistakeType = c.explanation.includes('very') ? 'Overuse of "Very"' :
                          c.explanation.includes('yesterday') ? 'Verb Tense' : 'Word Order'
      window.api.db.run(
        `INSERT INTO grammar_mistakes (type, description, count, last_seen)
         VALUES (?, ?, COALESCE((SELECT count FROM grammar_mistakes WHERE type = ?), 0) + 1, datetime('now'))
         ON CONFLICT(type) DO UPDATE SET count = count + 1, last_seen = datetime('now')`,
        [mistakeType, c.explanation]
      ).catch(() => {})
    })

    loadMistakes()
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleSubmit = () => {
    if (essay.trim().length < 20) return
    simulateAnalysis()
  }

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Writing</h2>
          <p className="text-gray-400 text-sm mt-1">Essays, grammar drills, and AI feedback</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-lg w-fit">
        {(['write', 'mistakes', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'write' ? '✍️ Write' : tab === 'mistakes' ? '⚠️ Top Mistakes' : '📜 History'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'write' && (
          <motion.div key="write" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Prompt */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">Writing Prompt</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono text-brand-400">{formatTime(timeLeft)}</span>
                  {running ? (
                    <span className="text-xs text-green-400 animate-pulse">● Writing...</span>
                  ) : submitted ? (
                    <span className="text-xs text-amber-400">✓ Complete</span>
                  ) : (
                    <span className="text-xs text-gray-500">10 min</span>
                  )}
                </div>
              </div>
              <p className="text-white font-medium mb-3">{prompt}</p>
              <button onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])} className="text-xs text-brand-400 hover:text-brand-300">
                🔄 Random Prompt
              </button>
            </div>

            {/* Essay textarea */}
            <div className="card p-5">
              <textarea
                value={essay}
                onChange={e => setEssay(e.target.value)}
                disabled={submitted}
                placeholder="Write your essay here... (minimum 20 words)"
                className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white resize-none focus:border-brand-500 focus:outline-none disabled:opacity-50 leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">{essay.split(/\s+/).filter(Boolean).length} words</span>
                <div className="flex gap-2">
                  {!submitted ? (
                    <>
                      <button
                        onClick={() => setRunning(!running)}
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        {running ? '⏸ Pause' : '▶ Start Timer'}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={essay.trim().length < 20}
                        className="btn-primary px-6 py-2 text-sm disabled:opacity-40"
                      >
                        Submit for Review
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSubmitted(false)
                        setEssay('')
                        setScore(0)
                        setCorrections([])
                        setTimeLeft(600)
                        setRunning(false)
                      }}
                      className="btn-primary px-6 py-2 text-sm"
                    >
                      Write Again
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            {submitted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Score */}
                <div className="card p-5 text-center mb-4">
                  <p className="text-4xl font-bold text-white mb-1">
                    <span className={score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}>
                      {score}/100
                    </span>
                  </p>
                  <p className="text-sm text-gray-400">Grammar & Writing Score</p>
                  <p className="text-xs text-brand-400 mt-2">+{score >= 80 ? 15 : 10} XP earned</p>
                </div>

                {/* Corrections */}
                {corrections.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white">Grammar Corrections</h4>
                    {corrections.map((c, i) => (
                      <GrammarCorrection key={i} {...c} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'mistakes' && (
          <motion.div key="mistakes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Top 20 Vietnamese→English Errors</h3>
            {TOP_MISTAKES.map(m => (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">{m.id}. {m.type}</h4>
                  {mistakes.find(mk => mk.type === m.type) && (
                    <span className="text-xs bg-red-950 text-red-300 px-2 py-0.5 rounded">
                      Seen {mistakes.find(mk => mk.type === m.type)?.count}x
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-2">{m.description}</p>
                <p className="text-brand-400 text-xs">{m.vn}</p>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Writing History</h3>
            {history.length === 0 ? (
              <div className="card flex items-center justify-center h-48 text-gray-500">No writing history yet</div>
            ) : (
              history.map((h, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{new Date(h.created_at).toLocaleDateString()}</span>
                    <span className={h.score && h.score >= 80 ? 'text-green-400' : h.score ? 'text-amber-400' : 'text-gray-500'}>
                      {h.score !== null ? `${h.score}%` : 'N/A'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-3 selectable">{h.content}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
