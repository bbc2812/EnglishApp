import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSRS } from '../hooks/useSRS'
import { useSessionStore, type FlashcardRow } from '../store/sessionStore'
import { useProgressStore } from '../store/progressStore'
import { useUnitProgress } from '../hooks/useUnitProgress'
import { useSettingsStore } from '../store/settingsStore'
import type { Rating } from '../lib/srs/fsrs'

const XP_PER_CARD = 2

const RATING_LABELS: { rating: Rating; label: string; color: string; key: string }[] = [
  { rating: 1, label: 'Again', color: 'bg-red-600 hover:bg-red-500', key: '1' },
  { rating: 2, label: 'Hard', color: 'bg-orange-600 hover:bg-orange-500', key: '2' },
  { rating: 3, label: 'Good', color: 'bg-green-600 hover:bg-green-500', key: '3' },
  { rating: 4, label: 'Easy', color: 'bg-brand-600 hover:bg-brand-500', key: '4' },
]

function playAudio(url: string | null): void {
  if (!url) return
  new Audio(url).play().catch(() => {})
}

function IpaBadge({ ipa }: { ipa: string | null }): JSX.Element | null {
  if (!ipa) return null
  return (
    <span className="text-brand-400 font-mono text-sm tracking-wide">/{ipa}/</span>
  )
}

function CardFront({ card }: { card: FlashcardRow }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full">
      <p className="text-5xl font-bold text-white tracking-tight selectable">{card.word}</p>
      <IpaBadge ipa={card.ipa} />
      {card.audio_url && (
        <button
          onClick={() => playAudio(card.audio_url)}
          className="text-gray-400 hover:text-white transition-colors text-2xl"
          title="Play pronunciation"
        >
          🔊
        </button>
      )}
      <p className="text-gray-500 text-sm mt-4">Press Space or click to reveal</p>
    </div>
  )
}

function CardBack({ card }: { card: FlashcardRow }): JSX.Element {
  const examples: string[] = (() => {
    try { return JSON.parse(card.examples ?? '[]') } catch { return [] }
  })()
  const [generating, setGenerating] = useState(false)
  const [localMnemonic, setLocalMnemonic] = useState(card.mnemonic)
  const { generateMnemonic, saveMnemonic } = useSRS()
  const { activeProvider } = useSettingsStore()

  const handleGenerateMnemonic = async () => {
    setGenerating(true)
    let mnemonic: string

    // Try AI first if API key available, fallback to local
    if ((activeProvider === 'claude' || activeProvider === 'gemini') && card.word.length > 2) {
      try {
        const provider = activeProvider === 'claude' ? 'claude' : 'gemini'
        const response = await window.api.ai.chat(
          provider,
          [{ role: 'user', content: `Generate a vivid, memorable mnemonic (memory trick) for the English word "${card.word}". Keep it to 1-2 sentences. Format: "WORD — memory story connecting the word's sound to its meaning."` }],
          'You are a creative memory coach. Generate vivid, unusual, and memorable mnemonics that connect the sound/visual appearance of a word to its meaning. Be creative and humorous.'
        )
        mnemonic = response
      } catch {
        // Fallback to local generation
        mnemonic = await generateMnemonic(card.word)
      }
    } else {
      mnemonic = await generateMnemonic(card.word)
    }

    await saveMnemonic(card.word_id, mnemonic)
    setLocalMnemonic(mnemonic)
    setGenerating(false)
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto py-2 selectable">
      <div className="flex items-baseline gap-3 flex-wrap">
        <p className="text-3xl font-bold text-white">{card.word}</p>
        <IpaBadge ipa={card.ipa} />
        {card.audio_url && (
          <button onClick={() => playAudio(card.audio_url)} className="text-gray-400 hover:text-white text-xl">
            🔊
          </button>
        )}
      </div>
      {card.definition && (
        <p className="text-gray-200 text-base leading-relaxed">{card.definition}</p>
      )}
      {examples.length > 0 && (
        <ul className="space-y-2">
          {examples.slice(0, 3).map((ex, i) => (
            <li key={i} className="text-gray-400 text-sm italic border-l-2 border-gray-700 pl-3">
              {ex}
            </li>
          ))}
        </ul>
      )}

      {/* Mnemonic section */}
      <div className="mt-2 pt-3 border-t border-gray-800">
        {localMnemonic ? (
          <details open>
            <summary className="text-sm font-semibold text-brand-400 cursor-pointer flex items-center gap-2">
              💡 Memory Trick
            </summary>
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">{localMnemonic}</p>
          </details>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">No memory trick yet</p>
            <button
              onClick={handleGenerateMnemonic}
              disabled={generating}
              className="text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50"
            >
              {generating ? 'Generating...' : '💡 Generate one'}
            </button>
          </div>
        )}
      </div>

      {/* Source context */}
      {card.source_sentence && (
        <div className="mt-2 pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 font-semibold mb-1">📍 First seen in:</p>
          <p className="text-gray-400 text-sm italic">"{card.source_sentence}"</p>
          {card.source_url && (
            <a
              href={card.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-400 hover:text-brand-300 mt-1 inline-block"
            >
              🔗 Play original context
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function DoneScreen({ total, onRestart, onBack, isUnit, sessionXp }: {
  total: number
  onRestart: () => void
  onBack: () => void
  isUnit: boolean
  sessionXp: number
}): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
      <p className="text-5xl">🎉</p>
      <h3 className="text-2xl font-bold text-white">Session Complete!</h3>
      <p className="text-gray-400">You reviewed <span className="text-white font-semibold">{total}</span> cards.</p>
      <p className="text-brand-400 font-medium">+{sessionXp} XP earned ({sessionXp > 0 ? `${Math.floor(sessionXp / XP_PER_CARD)} cards × ${XP_PER_CARD} XP` : '0 cards'})</p>
      <div className="flex gap-3">
        {isUnit && (
          <button onClick={onBack} className="btn-primary px-6 py-3 text-sm">
            Back to Dashboard
          </button>
        )}
        <button onClick={onRestart} className="btn-secondary px-6 py-3 text-sm">
          Start New Session
        </button>
      </div>
    </div>
  )
}

export default function Flashcards(): JSX.Element {
  const searchParams = useSearchParams()
  const navigate = useNavigate()
  const unitId = searchParams[0].get('unit')
  const { loadDueCards, applyRating } = useSRS()
  const { loadUnits } = useProgressStore()
  const { updateUnitProgress, checkAndUnlockNext } = useUnitProgress()
  const { queue, currentIndex, isFlipped, setQueue, flip, advance, recordRating, reset, queueId } =
    useSessionStore()
  const [loading, setLoading] = useState(false)
  const [sessionSource, setSessionSource] = useState<'srs' | 'unit'>('srs')
  const [sessionXp, setSessionXp] = useState(0)

  async function startSession(): Promise<void> {
    setLoading(true)
    setSessionXp(0)
    if (!window.api?.db) {
      setLoading(false)
      return
    }
    const cards = await loadDueCards(50)
    setQueue(cards, 'srs', 'flashcards', null)
    setSessionSource('srs')
    setLoading(false)
  }

  async function startUnitSession(uid: number): Promise<void> {
    setLoading(true)
    if (!window.api?.db) {
      setLoading(false)
      return
    }
    const words = await window.api.db.all(
      `SELECT w.id as word_id, w.word, w.ipa, w.audio_url, w.definition, w.examples
       FROM words w WHERE w.unit_id = ?`,
      [uid]
    ) as { word_id: number; word: string; ipa: string | null; audio_url: string | null; definition: string | null; examples: string | null }[]

    const cards: FlashcardRow[] = []
    for (const w of words) {
      const fc = await window.api.db.all(
        `SELECT * FROM flashcards WHERE word_id = ?`,
        [w.word_id]
      ) as { id: number; due_date: string; stability: number; difficulty: number; reps: number; lapses: number; state: string }[]
      if (fc.length > 0) {
        cards.push({ ...fc[0], word: w.word, ipa: w.ipa, audio_url: w.audio_url, definition: w.definition, examples: w.examples } as FlashcardRow)
      } else {
        cards.push({
          id: 0,
          word_id: w.word_id,
          word: w.word,
          ipa: w.ipa,
          audio_url: w.audio_url,
          definition: w.definition,
          examples: w.examples,
          due_date: new Date().toISOString().slice(0, 10),
          stability: 0,
          difficulty: 5,
          reps: 0,
          lapses: 0,
          state: 'new',
        } as FlashcardRow)
      }
    }

    if (cards.length > 0) {
      setQueue(cards, 'srs', 'flashcards', Number(uid))
      setSessionSource('unit')
    }
    setLoading(false)
  }

  async function loadFromParams(): Promise<void> {
    setLoading(true)
    if (unitId) {
      await startUnitSession(Number(unitId))
    } else {
      await startSession()
    }
    setLoading(false)
  }

  useEffect(() => {
    loadFromParams()
    return () => reset()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.code === 'Space' && !isFlipped) { e.preventDefault(); flip(); return }
      if (isFlipped) {
        const r = Number(e.key) as Rating
        if (r >= 1 && r <= 4) handleRate(r)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFlipped, currentIndex])

  const currentCard: FlashcardRow | undefined = queue[currentIndex]
  const isDone = !loading && queue.length > 0 && currentIndex >= queue.length

  async function handleRate(rating: Rating): Promise<void> {
    if (!currentCard) return
    recordRating(currentCard.id, rating)
    await applyRating(currentCard, rating)
    setSessionXp(prev => prev + XP_PER_CARD)
    advance()
  }

  const isUnitSession = sessionSource === 'unit' && queueId !== null

  const handleSessionDone = async () => {
    // Save session XP
    if (sessionXp > 0 && window.api?.db) {
      const today = new Date().toISOString().slice(0, 10)
      try {
        await window.api.db.run(
          `INSERT INTO daily_stats (date, xp_earned, streak)
           VALUES (?, ?, (SELECT COALESCE(streak, 0) FROM daily_stats WHERE date = ?))
           ON CONFLICT(date) DO UPDATE SET
             xp_earned = xp_earned + ?,
             streak = CASE WHEN date('now', '-1 day') = (SELECT date FROM daily_stats WHERE date = date('now', '-1 day')) THEN streak + 1 ELSE 1 END`,
          [today, sessionXp, today, sessionXp, today]
        )
      } catch { /* ignore */ }
    }

    if (isUnitSession && queueId) {
      await updateUnitProgress(queueId)
      const unlocked = await checkAndUnlockNext(queueId)
      if (unlocked) {
        await loadUnits()
      }
    }
    navigate('/')
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-gray-500">Loading cards…</p>
      </div>
    )
  }

  if (queue.length === 0 && !loading) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-1">Flashcards</h2>
        <p className="text-gray-400 text-sm mb-8">Spaced repetition — FSRS-4.5</p>
        <div className="card flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-4xl">✅</p>
          <p className="text-gray-300 font-medium">No cards due today!</p>
          <p className="text-gray-500 text-sm">
            {isUnitSession ? 'Unit study complete. Go back to the Dashboard to continue your journey.' : 'Come back tomorrow or add new words from the Dictionary popup.'}
          </p>
          {!isUnitSession && (
            <button onClick={startSession} className="btn-primary px-6 py-2.5 text-sm">
              Study Anyway
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Flashcards</h2>
            {isUnitSession && (
              <span className="text-xs text-brand-400 bg-brand-950 px-2 py-0.5 rounded">
                Unit Study
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">FSRS-4.5 spaced repetition</p>
        </div>
        {!isDone && (
          <p className="text-gray-500 text-sm">
            {currentIndex + 1} / {queue.length}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {!isDone && (
        <div className="w-full h-1.5 bg-gray-800 rounded-full mb-6">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / queue.length) * 100}%` }}
          />
        </div>
      )}

      {/* Card area */}
      <div className="flex-1 card min-h-0 relative overflow-hidden">
        {isDone ? (
          <DoneScreen total={queue.length} onRestart={startSession} onBack={handleSessionDone} isUnit={isUnitSession} sessionXp={sessionXp} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${isFlipped ? 'back' : 'front'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {!isFlipped ? (
                <div className="h-full cursor-pointer" onClick={flip}>
                  <CardFront card={currentCard!} />
                </div>
              ) : (
                <CardBack card={currentCard!} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Rating buttons */}
      {isFlipped && !isDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-3 mt-5"
        >
          {RATING_LABELS.map(({ rating, label, color, key }) => (
            <button
              key={rating}
              onClick={() => handleRate(rating)}
              className={`${color} text-white font-medium py-3 rounded-lg transition-colors text-sm`}
            >
              <span className="opacity-60 text-xs mr-1">[{key}]</span> {label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Flip button if not flipped */}
      {!isFlipped && !isDone && (
        <button
          onClick={flip}
          className="btn-secondary mt-5 py-3 w-full text-sm"
        >
          Show Answer <span className="opacity-50 ml-1">[Space]</span>
        </button>
      )}
    </div>
  )
}
