import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProgressStore, type UnitProgress } from '../store/progressStore'
import { useSessionStore } from '../store/sessionStore'
import { useSRS } from '../hooks/useSRS'

function CEFRBadge({ level }: { level: string }): JSX.Element {
  const colorMap: Record<string, string> = {
    B1: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    B2: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    C1: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    C2: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${colorMap[level] || 'bg-gray-500/10 text-gray-400'}`}>
      {level}
    </span>
  )
}

function CompletionRing({ percent, size = 40, strokeWidth = 3, unlocked }: {
  percent: number; size?: number; strokeWidth?: number; unlocked: number
}): JSX.Element {
  const safePercent = typeof percent === 'string' ? parseFloat(percent) || 0 : (percent ?? 0)
  const safeSize = size ?? 40
  const safeStrokeWidth = strokeWidth ?? 3
  const radius = (safeSize - safeStrokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safePercent / 100) * circumference
  const strokeColor = safePercent >= 80 ? '#22c55e' : safePercent >= 40 ? '#eab308' : '#0ea5e9'

  return (
    <div className="relative flex items-center justify-center" style={{ width: safeSize, height: safeSize }}>
      <svg width={safeSize} height={safeSize} className="-rotate-90">
        <circle
          cx={safeSize / 2} cy={safeSize / 2} r={radius}
          fill="none" stroke="#1f2937" strokeWidth={safeStrokeWidth}
        />
        {safePercent > 0 && (
          <circle
            cx={safeSize / 2} cy={safeSize / 2} r={radius}
            fill="none" stroke={strokeColor} strokeWidth={safeStrokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
      </svg>
      {!unlocked && (
        <span className="absolute text-gray-600 text-xs" title="Locked">
          🔒
        </span>
      )}
    </div>
  )
}

const UNIT_POSITIONS = [
  { x: 80, y: 0 },
  { x: 200, y: -30 },
  { x: 320, y: 0 },
  { x: 440, y: -30 },
  { x: 560, y: 0 },
  { x: 680, y: -30 },
  { x: 800, y: 0 },
  { x: 920, y: -30 },
  { x: 1040, y: 0 },
  { x: 1160, y: -30 },
  { x: 1280, y: 0 },
  { x: 1400, y: -30 },
]

function generatePath(positions: typeof UNIT_POSITIONS): string {
  if (positions.length === 0) return ''
  let path = `M ${positions[0].x} ${positions[0].y}`
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1]
    const curr = positions[i]
    const cpx1 = prev.x + (curr.x - prev.x) * 0.5
    const cpy1 = prev.y
    const cpx2 = prev.x + (curr.x - prev.x) * 0.5
    const cpy2 = curr.y
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
  }
  return path
}

function RoadmapSVG({
  units,
  onUnitClick,
}: {
  units: UnitProgress[]
  onUnitClick: (unit: UnitProgress) => void
}): JSX.Element {
  const positions = useMemo(() => UNIT_POSITIONS.slice(0, units.length), [units.length])
  const pathD = useMemo(() => generatePath(positions), [positions])
  const pathLength = 2500
  const totalUnits = units.length || 1
  const unlockedCount = units.filter((u) => u.unlocked).length

  return (
    <div className="card overflow-x-auto pb-3">
      <div className="min-w-[700px]">
        <svg width="1480" height="200" className="overflow-visible">
          {/* Background path */}
          <path
            d={pathD}
            fill="none"
            stroke="#111827"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Animated progress path */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ strokeDasharray: pathLength, strokeDashoffset: pathLength }}
            animate={{ strokeDashoffset: pathLength - (unlockedCount / totalUnits) * pathLength }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          {/* Unit nodes */}
          {units.map((unit, i) => {
            const pos = positions[i]
            const isComplete = unit.percent_complete >= 80
            const isUnlocked = unit.unlocked === 1

            return (
              <motion.g
                key={unit.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 12 }}
                className="cursor-pointer"
                onClick={() => onUnitClick(unit)}
              >
                {/* Glow effect for unlocked units */}
                {isUnlocked && (
                  <motion.circle
                    cx={pos.x} cy={pos.y + 20} r="28"
                    fill="none"
                    stroke={isComplete ? '#22c55e' : '#06b6d4'}
                    strokeWidth="1"
                    opacity="0.2"
                    animate={{ r: [26, 32, 26], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                  />
                )}
                {/* Completion ring */}
                <CompletionRing
                  percent={unit.percent_complete}
                  size={52}
                  strokeWidth={3}
                  unlocked={unit.unlocked}
                />
                {/* Unit number badge */}
                <circle
                  cx={pos.x} cy={pos.y + 20} r={isUnlocked ? 22 : 20}
                  fill={isUnlocked ? '#111827' : '#1f2937'}
                  stroke={isComplete ? '#22c55e' : isUnlocked ? '#374151' : '#4b5563'}
                  strokeWidth={isComplete ? 2 : 1}
                />
                {/* Unit title */}
                <text
                  x={pos.x} y={pos.y + 62}
                  textAnchor="middle"
                  fill={isUnlocked ? '#e5e7eb' : '#4b5563'}
                  fontSize="11"
                  fontWeight={isUnlocked ? 600 : 400}
                  className="select-none pointer-events-none"
                >
                  {unit.title}
                </text>
                {/* CEFR level */}
                <text
                  x={pos.x} y={pos.y + 76}
                  textAnchor="middle"
                  fill={isUnlocked ? '#9ca3af' : '#374151'}
                  fontSize="9"
                  className="select-none pointer-events-none"
                >
                  {unit.cefr_level}
                </text>
                {/* Percent text inside ring */}
                {isUnlocked && unit.percent_complete > 0 && (
                  <text
                    x={pos.x} y={pos.y + 20}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isComplete ? '#22c55e' : '#e5e7eb'}
                    fontSize="9"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {Math.round(unit.percent_complete)}%
                  </text>
                )}
              </motion.g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subValue }: {
  icon: string
  label: string
  value: string | number
  subValue?: string
}): JSX.Element {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card text-center"
    >
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subValue && <p className="text-xs text-brand-400 font-medium mt-0.5">{subValue}</p>}
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </motion.div>
  )
}

function VocabSetsSection({
  vocabSets,
  onSetClick,
}: {
  vocabSets: { id: number; title: string; topic: string; level: string }[]
  onSetClick: (set: { id: number; title: string; topic: string; level: string }) => void
}): JSX.Element | null {
  if (vocabSets.length === 0) return null
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">Topical Vocabulary Sets</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {vocabSets.map((set, i) => (
          <motion.button
            key={set.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSetClick(set)}
            className="card text-left p-3 hover:border-brand-500 transition-colors"
          >
            <p className="text-sm font-semibold text-white truncate">{set.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <CEFRBadge level={set.level} />
              <span className="text-xs text-gray-500 capitalize">{set.topic}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function SkeletonDashboard(): JSX.Element {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 skeleton" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card" />)}
      </div>
      <div className="skeleton-card h-48" />
    </div>
  )
}

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const { units, loadUnits, setTodayStats, setTodayXP, todayXP } = useProgressStore()
  const { setQueue } = useSessionStore()
  const { loadVocabSetCards, loadDueCards } = useSRS()
  const [loading, setLoading] = useState(true)
  const [vocabSets, setVocabSets] = useState<{ id: number; title: string; topic: string; level: string }[]>([])
  const [lessons, setLessons] = useState<{ id: number; title: string; type: string; locked: number }[]>([])
  const [stats, setStats] = useState<{
    wordsReviewed: number;
    streak: number;
    lessonsCompleted: number;
    totalWords: number;
    totalXp: number;
    challengeStreak: number;
  }>({
    wordsReviewed: 0,
    streak: 0,
    lessonsCompleted: 0,
    totalWords: 0,
    totalXp: 0,
    challengeStreak: 0,
  })
  const [dailyChallenge, setDailyChallenge] = useState<{ type: string; completed: number; xp_reward: number } | null>(null)
  const [achievementCount, setAchievementCount] = useState(0)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    if (!window.api?.db) {
      setLoading(false)
      return
    }

    await loadUnits()

    const [dailyStats, vocabSetsData, lessonCount, wordCount, unlockedLessons, challenge, achievements]: [any[], any[], unknown, unknown, unknown, unknown, unknown] =
      await Promise.all([
        window.api.db.all(
          `SELECT * FROM daily_stats WHERE date = ? ORDER BY date DESC LIMIT 1`,
          [new Date().toISOString().slice(0, 10)]
        ) as Promise<any[]>,
        window.api.db.all(
          `SELECT id, title, topic, level FROM vocab_sets ORDER BY id`
        ) as Promise<any[]>,
        window.api.db.all(`SELECT COUNT(*) as count FROM lesson_progress WHERE completed_at LIKE ?`, [`${new Date().toISOString().slice(0, 10)}%`]) as Promise<unknown>,
        window.api.db.all(`SELECT COUNT(*) as count FROM words`) as Promise<unknown>,
        window.api.db.all(
          `SELECT id, title, type, locked FROM lessons WHERE unit_id IN (SELECT id FROM units WHERE unlocked = 1) AND type IN ('listening', 'reading') ORDER BY unit_id, id`
        ) as Promise<any[]>,
        window.api.db.all(
          `SELECT type, completed, xp_reward FROM daily_challenges WHERE date = date('now') ORDER BY date LIMIT 1`
        ) as Promise<any[]>,
        window.api.db.all(
          `SELECT COUNT(*) as count FROM achievements WHERE unlocked_at IS NOT NULL`
        ) as Promise<unknown>,
      ])

    if (dailyStats.length > 0) {
      const ds = dailyStats[0]
      setTodayStats({
        date: ds.date,
        wordsReviewed: ds.words_reviewed || 0,
        newWords: ds.new_words || 0,
        listeningMins: ds.listening_mins || 0,
        speakingMins: ds.speaking_mins || 0,
        writingMins: ds.writing_mins || 0,
        streak: ds.streak || 0,
      })
      setStats((prev) => ({ ...prev, wordsReviewed: ds.words_reviewed || 0, streak: ds.streak || 0, challengeStreak: 0 }))
    }

    const lessonsResult = lessonCount as { count?: number }[] | { count?: number }
    const wordsResult = wordCount as { count?: number }[] | { count?: number }
    const lessonC = Array.isArray(lessonsResult) ? (lessonsResult[0] as { count?: number })?.count || 0 : (lessonsResult as { count?: number })?.count || 0
    const wordC = Array.isArray(wordsResult) ? (wordsResult[0] as { count?: number })?.count || 0 : (wordsResult as { count?: number })?.count || 0

    const xpEarned = lessonC * 20
    setTodayXP(xpEarned)

    setVocabSets(vocabSetsData)
    setLessons(unlockedLessons as { id: number; title: string; type: string; locked: number }[])
    setStats(prev => ({ ...prev, lessonsCompleted: lessonC, totalWords: wordC, challengeStreak: prev.challengeStreak }))
    const challengeResult = challenge as { type?: string; completed?: number; xp_reward?: number }[]
    if (challengeResult.length > 0) {
      setDailyChallenge({
        type: challengeResult[0].type || 'vocab_blitz',
        completed: challengeResult[0].completed || 0,
        xp_reward: challengeResult[0].xp_reward || 25,
      })
    } else {
      setDailyChallenge(null)
    }
    const achResult = achievements as { count?: number }[]
    setAchievementCount(Array.isArray(achResult) ? (achResult[0]?.count || 0) : 0)



    setLoading(false)
  }, [loadUnits, setTodayStats, setTodayXP])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleUnitClick = (unit: UnitProgress) => {
    if (unit.unlocked) {
      navigate(`/flashcards?unit=${unit.id}`)
    }
  }

  const handleVocabSetClick = (set: { id: number; title: string; topic: string; level: string }) => {
    loadVocabSetCards(set.id).then((cards) => {
      if (cards.length > 0) {
        setQueue(cards, 'vocab_set', 'vocab_set', set.id)
        navigate('/flashcards')
      }
    })
  }

  const handleStartFlashcards = () => {
    loadDueCards().then((cards) => {
      if (cards.length > 0) {
        setQueue(cards, 'srs', 'flashcards', null)
        navigate('/flashcards')
      }
    })
  }

  if (loading) {
    return <SkeletonDashboard />
  }

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">{greeting} 👋</h2>
          <p className="text-gray-400 text-sm mt-1">Your learning roadmap and daily progress</p>
        </div>
        <button onClick={handleStartFlashcards} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <span>🃏</span> Study Flashcards
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📝" label="Words Reviewed" value={stats.wordsReviewed} />
        <StatCard icon="📚" label="Total Words" value={stats.totalWords} />
        <StatCard icon="🔥" label="Streak" value={`${stats.streak} days`} subValue={stats.challengeStreak > 0 ? `${stats.challengeStreak}/7 daily streak` : undefined} />
        <StatCard icon="⭐" label="Today's XP" value={todayXP} subValue={`${stats.lessonsCompleted} lessons`} />
      </div>

      {/* Daily Challenge */}
      {dailyChallenge && (
        <div className="card p-4 mb-6 border-brand-900/50 bg-brand-950/10 card-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <div>
                <h4 className="text-white font-semibold text-sm">Daily Challenge</h4>
                <p className="text-gray-400 text-xs">
                  {dailyChallenge.completed ? (
                    <span className="text-green-400">✅ Completed! +{dailyChallenge.xp_reward} XP</span>
                  ) : (
                    <span>
                      {(() => {
                        switch (dailyChallenge.type) {
                          case 'vocab_blitz': return '20 flashcards in 5 min'
                          case 'listening_dictation': return 'Transcribe 60s audio'
                          case 'shadow_master': return 'Nail 3 sentences ≥80%'
                          case 'writing_sprint': return '150-word essay in 10 min'
                          case 'grammar_gauntlet': return '10 error-detection questions'
                          default: return 'Complete today\'s challenge'
                        }
                      })()}{' — '}
                      <span className="text-brand-400">+{dailyChallenge.xp_reward} XP</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            {!dailyChallenge.completed && (
              <button
                onClick={() => navigate('/flashcards')}
                className="btn-primary px-4 py-2 text-xs"
              >
                Start
              </button>
            )}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievementCount > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500">🏅 Achievements:</span>
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
            {achievementCount} unlocked
          </span>
        </div>
      )}

      {/* Roadmap */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Learning Roadmap</h3>
          <span className="text-sm text-gray-500">
            {units.filter((u) => u.unlocked).length} / {units.length} units unlocked
          </span>
        </div>
        <RoadmapSVG units={units} onUnitClick={handleUnitClick} />
        <p className="text-xs text-gray-600 mt-3 text-center">
          Complete 80% of a unit's lessons to unlock the next one. Click a unit to study.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.button
          onClick={() => navigate('/flashcards')}
          whileHover={{ y: -2 }}
          className="card p-4 text-left"
        >
          <p className="text-2xl mb-2">🃏</p>
          <p className="text-sm font-semibold text-white">Flashcards</p>
          <p className="text-xs text-gray-500 mt-1">Review due words with FSRS</p>
        </motion.button>
        <motion.button
          onClick={() => navigate('/listening')}
          whileHover={{ y: -2 }}
          className="card p-4 text-left"
        >
          <p className="text-2xl mb-2">🎧</p>
          <p className="text-sm font-semibold text-white">Listening</p>
          <p className="text-xs text-gray-500 mt-1">Practice with audio content</p>
        </motion.button>
        <motion.button
          onClick={() => navigate('/tutor')}
          whileHover={{ y: -2 }}
          className="card p-4 text-left"
        >
          <p className="text-2xl mb-2">🤖</p>
          <p className="text-sm font-semibold text-white">AI Tutor</p>
          <p className="text-xs text-gray-500 mt-1">Chat and get personalized help</p>
        </motion.button>
      </div>

      {/* Active Lessons */}
      {lessons.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Your Lessons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lessons.map((lesson, i) => (
              <motion.button
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/${lesson.type}?lesson=${lesson.id}`)}
                disabled={lesson.locked === 1}
                className="card text-left p-4 hover:border-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{lesson.type === 'listening' ? '🎧' : '📖'}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    lesson.type === 'listening' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {lesson.type === 'listening' ? 'Listening' : 'Reading'}
                  </span>
                  {lesson.locked && <span className="text-xs text-gray-500 ml-auto">🔒</span>}
                </div>
                <p className="text-sm font-semibold text-white truncate">{lesson.title}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Vocab Sets */}
      <VocabSetsSection vocabSets={vocabSets} onSetClick={handleVocabSetClick} />
    </div>
  )
}
