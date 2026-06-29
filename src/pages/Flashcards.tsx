import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSRS } from '../hooks/useSRS'
import { useSessionStore, type FlashcardRow } from '../store/sessionStore'
import type { Rating } from '../lib/srs/fsrs'

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
    </div>
  )
}

function DoneScreen({ total, onRestart }: { total: number; onRestart: () => void }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
      <p className="text-5xl">🎉</p>
      <h3 className="text-2xl font-bold text-white">Session Complete!</h3>
      <p className="text-gray-400">You reviewed <span className="text-white font-semibold">{total}</span> cards.</p>
      <button onClick={onRestart} className="btn-primary px-8 py-3 text-base">
        Start New Session
      </button>
    </div>
  )
}

export default function Flashcards(): JSX.Element {
  const { loadDueCards, applyRating } = useSRS()
  const { queue, currentIndex, isFlipped, setQueue, flip, advance, recordRating, reset } =
    useSessionStore()
  const [loading, setLoading] = useState(false)
  const [totalDue, setTotalDue] = useState(0)

  async function startSession(): Promise<void> {
    setLoading(true)
    const cards = await loadDueCards(50)
    setTotalDue(cards.length)
    setQueue(cards)
    setLoading(false)
  }

  useEffect(() => {
    startSession()
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
    advance()
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
          <p className="text-gray-500 text-sm">Come back tomorrow or add new words from the Dictionary popup.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Flashcards</h2>
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
          <DoneScreen total={queue.length} onRestart={startSession} />
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
