import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Howler, { Howl } from 'howler'
import { motion, AnimatePresence } from 'framer-motion'
import { useUnitProgress } from '../hooks/useUnitProgress'
import { useProgressStore } from '../store/progressStore'

interface Exercise {
  id: number
  lesson_id: number
  question: string
  options: string | null
  answer: string
  type: string
}

interface Lesson {
  id: number
  unit_id: number
  title: string
  type: string
  content_url: string | null
  transcript: string | null
  locked: number
}

type Phase = 'intro' | 'listening' | 'exercises' | 'results'

function AudioPlayer({ url, transcript }: { url: string | null; transcript: string | null }): JSX.Element {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [highlightedLine, setHighlightedLine] = useState('')
  const soundRef = useRef<Howl | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!url) {
      setPlaying(false)
      return
    }
    soundRef.current = new Howl({
      src: [url],
      volume: 0.8,
      rate: speed,
      onend: () => { setPlaying(false); setProgress(100) },
      onplay: () => {
        setPlaying(true)
        intervalRef.current = setInterval(() => {
          if (soundRef.current) {
            const curr = soundRef.current.seek() as number
            const dur = soundRef.current.duration()
            setCurrentTime(curr)
            setDuration(dur)
            setProgress((curr / dur) * 100)
            if (transcript) {
              const sentenceIndex = Math.min(
                Math.floor((curr / dur) * 3),
                2
              )
              const lines = transcript.split('. ')
              setHighlightedLine(lines[sentenceIndex] || '')
            }
          }
        }, 500)
      },
      onpause: () => {
        setPlaying(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    })
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      try { (Howler as any).unload() } catch { /* ignore */ }
    }
  }, [url])

  const togglePlay = () => {
    if (!soundRef.current) return
    if (playing) soundRef.current.pause()
    else soundRef.current.play()
  }

  const skip = (seconds: number) => {
    if (!soundRef.current) return
    soundRef.current.seek(soundRef.current.seek() + seconds)
  }

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed)
    if (soundRef.current) soundRef.current.rate(newSpeed)
  }

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!soundRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    soundRef.current.seek(x * duration)
  }

  if (!url || !transcript) {
    return (
      <div className="card p-4 bg-gray-800/50">
        <p className="text-gray-500 text-sm">Audio not available for this lesson</p>
        <p className="text-gray-600 text-xs mt-1">Listening practice with transcript below</p>
      </div>
    )
  }

  const sentences = transcript.split('. ')

  return (
    <div className="card p-4">
      {/* Audio controls */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 flex items-center justify-center text-white text-lg flex-shrink-0">
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={() => skip(-10)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800">-10s</button>
        <button onClick={() => skip(10)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800">+10s</button>

        {/* Progress bar */}
        <div
          className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer relative"
          onClick={seekTo}
        >
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 w-20 text-right">{formatTime(currentTime)}</span>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">Speed:</span>
        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            className={`text-xs px-2 py-0.5 rounded ${speed === s ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Transcript with line highlighting */}
      <div className="space-y-2 mt-3">
        {sentences.map((sentence, i) => {
          if (!sentence.trim()) return null
          const isHighlighted = highlightedLine.includes(sentence.trim().substring(0, 20))
          return (
            <p
              key={i}
              className={`text-sm leading-relaxed transition-all ${
                isHighlighted
                  ? 'text-brand-400 font-semibold bg-brand-950/30 px-2 py-1 rounded'
                  : 'text-gray-400'
              }`}
            >
              {sentence.trim()}.{sentence.trim().endsWith('.') ? '' : ''}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function MCQExercise({
  exercise,
  onAnswer
}: {
  exercise: Exercise
  onAnswer: (correct: boolean) => void
}): JSX.Element {
  const [selected, setSelected] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const options = exercise.options?.split('/') || []

  const handleSubmit = () => {
    const correct = selected.toLowerCase().trim() === exercise.answer.toLowerCase().trim()
    setSubmitted(true)
    onAnswer(correct)
  }

  const isCorrect = submitted && selected.toLowerCase().trim() === exercise.answer.toLowerCase().trim()

  return (
    <div className="space-y-3">
      <p className="text-white font-medium">{exercise.question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && setSelected(opt)}
            disabled={submitted}
            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
              submitted
                ? opt.toLowerCase().trim() === exercise.answer.toLowerCase().trim()
                  ? 'border-green-500 bg-green-950/30 text-green-300'
                  : selected.toLowerCase().trim() === opt.toLowerCase().trim()
                    ? 'border-red-500 bg-red-950/30 text-red-300'
                    : 'border-gray-700 bg-gray-800 text-gray-500'
                : selected.toLowerCase().trim() === opt.toLowerCase().trim()
                  ? 'border-brand-500 bg-brand-950/30 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="btn-primary px-6 py-2 text-sm disabled:opacity-40"
        >
          Check Answer
        </button>
      )}
      {submitted && (
        <p className={`text-sm font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
          {isCorrect ? '✅ Correct!' : `❌ Correct answer: ${exercise.answer}`}
        </p>
      )}
    </div>
  )
}

function FillExercise({
  exercise,
  onAnswer
}: {
  exercise: Exercise
  onAnswer: (correct: boolean) => void
}): JSX.Element {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = submitted && input.trim().toLowerCase() === exercise.answer.toLowerCase().trim()

  const handleSubmit = () => {
    setSubmitted(true)
    onAnswer(isCorrect)
  }

  return (
    <div className="space-y-3">
      <p className="text-white font-medium">{exercise.question}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={submitted}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-brand-500 focus:outline-none disabled:opacity-50"
          placeholder="Type your answer..."
          onKeyDown={e => e.key === 'Enter' && !submitted && handleSubmit()}
        />
        {!submitted ? (
          <button onClick={handleSubmit} className="btn-primary px-5 py-2.5 text-sm" disabled={!input.trim()}>
            Check
          </button>
        ) : (
          <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${isCorrect ? 'bg-green-950/50 text-green-300' : 'bg-red-950/50 text-red-300'}`}>
            {isCorrect ? '✅ Correct!' : `Answer: ${exercise.answer}`}
          </div>
        )}
      </div>
    </div>
  )
}

function ExerciseCard({
  exercise,
  onAnswer,
  index
}: {
  exercise: Exercise
  onAnswer: (correct: boolean) => void
  index: number
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-brand-400 bg-brand-950 px-2 py-0.5 rounded">Q{index + 1}</span>
        <span className="text-xs text-gray-500">{exercise.type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}</span>
      </div>
      {exercise.type === 'mcq' ? (
        <MCQExercise exercise={exercise} onAnswer={onAnswer} />
      ) : (
        <FillExercise exercise={exercise} onAnswer={onAnswer} />
      )}
    </motion.div>
  )
}

export default function Listening(): JSX.Element {
  const searchParams = useSearchParams()
  const navigate = useNavigate()
  const lessonId = searchParams[0].get('lesson')
  const { completeLesson, checkAndUnlockNext } = useUnitProgress()
  const { loadUnits, setTodayXP } = useProgressStore()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('intro')
  const [answers, setAnswers] = useState<(boolean | null)[]>([])
  const [completedAt, setCompletedAt] = useState<number>(0)

  const loadLesson = useCallback(async () => {
    if (!lessonId) return
    setLoading(true)

    const les = await window.api.db.all(
      `SELECT * FROM lessons WHERE id = ?`,
      [lessonId]
    ) as Lesson[]

    if (les.length === 0) {
      setLoading(false)
      return
    }

    setLesson(les[0])
    const exs = await window.api.db.all(
      `SELECT * FROM exercises WHERE lesson_id = ? ORDER BY id`,
      [lessonId]
    ) as Exercise[]
    setExercises(exs)
    setAnswers(new Array(exs.length).fill(null))
    setLoading(false)
  }, [lessonId])

  useEffect(() => {
    loadLesson()
  }, [loadLesson])

  const handleExerciseAnswer = (index: number, correct: boolean) => {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = correct
      return next
    })
  }

  const allAnswered = answers.every(a => a !== null)
  const correctCount = answers.filter(a => a === true).length
  const score = allAnswered ? Math.round((correctCount / exercises.length) * 100) : 0

  const handleComplete = async () => {
    if (!lesson) return
    await completeLesson(lesson.id, score)
    setCompletedAt(Date.now())
    const xpEarned = score >= 80 ? 20 : 10
    const todayXP = xpEarned
    setTodayXP(todayXP)

    await loadUnits()
    if (score >= 80) {
      const unlocked = await checkAndUnlockNext(lesson.unit_id)
      if (unlocked) {
        await loadUnits()
      }
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-gray-500">Loading lesson…</p>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-1">Listening</h2>
        <p className="text-gray-400 text-sm mb-8">Audio lessons with comprehension exercises</p>
        <div className="card flex items-center justify-center h-64 text-gray-600">
          Lesson not found
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{lesson.title}</h2>
          <p className="text-gray-400 text-sm mt-1">Listening Practice · Unit {lesson.unit_id}</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-secondary px-4 py-2 text-sm">
          ← Back
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Phase: Listening */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="card p-6 text-center">
              <p className="text-4xl mb-3">🎧</p>
              <h3 className="text-xl font-bold text-white mb-2">Ready to listen?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Listen to the audio carefully. You will answer {exercises.length} comprehension questions.
              </p>
              <p className="text-xs text-gray-500">Tip: Try listening twice — once for gist, once for details.</p>
              <button
                onClick={() => setPhase('listening')}
                className="btn-primary px-8 py-3 text-base mt-4"
              >
                Start Listening
              </button>
            </div>

            {/* Transcript preview */}
            {lesson.transcript && (
              <div className="card p-5">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">📝 Transcript (for reference)</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{lesson.transcript}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Phase: Listening + Exercises */}
        {phase === 'listening' && (
          <motion.div
            key="listening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Audio player */}
            <AudioPlayer url={lesson.content_url} transcript={lesson.transcript} />

            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${(answers.filter(a => a !== null).length / exercises.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{answers.filter(a => a !== null).length}/{exercises.length} answered</span>
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Comprehension Exercises</h3>
              {exercises.map((ex, i) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onAnswer={(correct) => handleExerciseAnswer(i, correct)}
                  index={i}
                />
              ))}
            </div>

            {/* Submit button */}
            {allAnswered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card p-5 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-400">{correctCount}</p>
                      <p className="text-xs text-gray-500">Correct</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-brand-400">{score}%</p>
                      <p className="text-xs text-gray-500">Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{exercises.length}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                  {score >= 80 ? (
                    <p className="text-green-400 text-sm mb-3">🎉 Great job! You passed! Click below to save your progress.</p>
                  ) : (
                    <p className="text-amber-400 text-sm mb-3">Keep practicing! You need 80% to unlock the next unit. Review the transcript and try again.</p>
                  )}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { setPhase('intro'); setAnswers(new Array(exercises.length).fill(null)) }}
                      className="btn-secondary px-6 py-2.5 text-sm"
                    >
                      Retry
                    </button>
                    <button
                      onClick={handleComplete}
                      className="btn-primary px-6 py-2.5 text-sm"
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Phase: Results */}
        {phase === 'results' && completedAt > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            <p className="text-5xl mb-4">{score >= 80 ? '🎉' : '💪'}</p>
            <h3 className="text-2xl font-bold text-white mb-2">
              {score >= 80 ? 'Lesson Complete!' : 'Keep Practicing!'}
            </h3>
            <p className="text-gray-400 mb-2">
              You scored <span className="text-white font-semibold">{score}%</span> ({correctCount}/{exercises.length})
            </p>
            <p className="text-sm text-brand-400 mb-6">+{score >= 80 ? 20 : 10} XP earned</p>
            {score >= 80 && (
              <p className="text-green-400 text-sm mb-4">
                📈 Unit progress updated! Next unit may be unlocked.
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setPhase('intro'); setAnswers(new Array(exercises.length).fill(null)); setCompletedAt(0) }}
                className="btn-secondary px-6 py-2.5 text-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-primary px-6 py-2.5 text-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
