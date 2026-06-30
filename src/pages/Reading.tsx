import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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

type Phase = 'intro' | 'reading' | 'exercises' | 'results'

function WordHighlight({ text, onWordClick }: { text: string; onWordClick: (word: string) => void }) {
  const words = text.split(/(\s+)/)
  return (
    <span className="selectable">
      {words.map((w, i) => {
        const isWord = /^[a-zA-Z'-]+$/.test(w) && w.length > 2
        if (!isWord) return <span key={i}>{w}</span>
        return (
          <span
            key={i}
            className="cursor-pointer hover:text-brand-400 hover:bg-brand-950/30 px-0.5 rounded transition-colors"
            onClick={() => onWordClick(w)}
          >
            {w}
          </span>
        )
      })}
    </span>
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

export default function Reading(): JSX.Element {
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

  const handleWordClick = (word: string) => {
    // The DictionaryPopup handles word selection via mouseup
    // Clicking a highlighted word simulates selection
    const el = document.createElement('span')
    el.textContent = word
    document.body.appendChild(el)
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    document.body.removeChild(el)
  }

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
    setTodayXP(xpEarned)
    await loadUnits()
    if (score >= 80) {
      const unlocked = await checkAndUnlockNext(lesson.unit_id)
      if (unlocked) await loadUnits()
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-gray-500">Loading article…</p>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-1">Reading</h2>
        <p className="text-gray-400 text-sm mb-8">Articles with click-to-define vocabulary</p>
        <div className="card flex items-center justify-center h-64 text-gray-600">
          Article not found
        </div>
      </div>
    )
  }

  if (!lesson.transcript) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-1">Reading</h2>
        <p className="text-gray-400 text-sm mb-8">Articles with click-to-define vocabulary</p>
        <div className="card flex items-center justify-center h-64 text-gray-600">
          Article content loading…
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
          <p className="text-gray-400 text-sm mt-1">Reading Practice · Unit {lesson.unit_id}</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-secondary px-4 py-2 text-sm">
          ← Back
        </button>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="card p-6 text-center">
              <p className="text-4xl mb-3">📖</p>
              <h3 className="text-xl font-bold text-white mb-2">Ready to read?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Read the article carefully. Click any highlighted word to look up its definition.
                Then answer {exercises.length} comprehension questions.
              </p>
              <p className="text-xs text-gray-500">💡 Tip: Click unknown words to see definitions instantly.</p>
              <button
                onClick={() => setPhase('reading')}
                className="btn-primary px-8 py-3 text-base mt-4"
              >
                Start Reading
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'reading' && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Article */}
            <div className="card p-6 selectable">
              <h3 className="text-lg font-semibold text-white mb-4">📄 Article</h3>
              <div className="space-y-3 text-gray-300 leading-relaxed text-base">
                {lesson.transcript.split('. ').filter(Boolean).map((sentence, i) => (
                  <p key={i} className="leading-relaxed">
                    <WordHighlight text={sentence} onWordClick={handleWordClick} />.
                  </p>
                ))}
              </div>
            </div>

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
                    <p className="text-amber-400 text-sm mb-3">Keep practicing! You need 80% to unlock the next unit.</p>
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
              <p className="text-green-400 text-sm mb-4">📈 Unit progress updated!</p>
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
