import { useEffect, useRef, useState } from 'react'
import { useDictionary, type DictEntry } from '../../hooks/useDictionary'
import { useSRS } from '../../hooks/useSRS'

type Tab = 'pronounce' | 'en-en' | 'en-vn'

interface PopupState {
  word: string
  x: number
  y: number
}

function playAudio(url: string | null): void {
  if (!url) return
  new Audio(url).play().catch(() => {})
}

function PopupContent({
  word,
  onClose
}: {
  word: string
  onClose: () => void
}): JSX.Element {
  const [tab, setTab] = useState<Tab>('pronounce')
  const [entry, setEntry] = useState<DictEntry | null>(null)
  const [translation, setTranslation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const { lookup, translate } = useDictionary()
  const { addWordToFlashcards } = useSRS()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setEntry(null)
    setTranslation(null)

    lookup(word).then((e) => {
      if (!cancelled) { setEntry(e); setLoading(false) }
    })

    return () => { cancelled = true }
  }, [word])

  useEffect(() => {
    if (tab === 'en-vn' && translation === null) {
      translate(word).then(setTranslation)
    }
  }, [tab, word])

  async function handleAddToFlashcards(): Promise<void> {
    if (!entry) return
    // Upsert word, then add flashcard
    const existing = await window.api.db.query(
      'SELECT id FROM words WHERE word = ?',
      [entry.word]
    ) as { id: number } | undefined

    let wordId: number
    if (existing) {
      wordId = existing.id
    } else {
      const examples = entry.meanings.flatMap((m) => (m.example ? [m.example] : []))
      const res = await window.api.db.run(
        `INSERT INTO words (word, ipa, audio_url, definition, examples)
         VALUES (?, ?, ?, ?, ?)`,
        [
          entry.word,
          entry.phonetic,
          entry.audio,
          entry.meanings[0]?.definition ?? null,
          JSON.stringify(examples)
        ]
      )
      wordId = res.lastInsertRowid
    }

    await addWordToFlashcards(wordId)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pronounce', label: '🔊 Pronounce' },
    { id: 'en-en', label: 'EN-EN' },
    { id: 'en-vn', label: 'EN-VN' }
  ]

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-72 text-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="font-bold text-white truncate">{word}</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white ml-2 flex-shrink-0">
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'text-brand-400 border-b-2 border-brand-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 min-h-[100px] selectable">
        {loading && <p className="text-gray-500 text-center py-4">Looking up…</p>}

        {!loading && tab === 'pronounce' && (
          <div className="flex flex-col items-center gap-3 py-2">
            {entry?.phonetic && (
              <p className="text-brand-400 font-mono text-lg">/{entry.phonetic}/</p>
            )}
            {entry?.audio ? (
              <button
                onClick={() => playAudio(entry.audio)}
                className="btn-primary px-6 py-2 text-sm"
              >
                🔊 Play
              </button>
            ) : (
              <p className="text-gray-500 text-xs">No audio available</p>
            )}
            {!entry && !loading && (
              <p className="text-gray-500 text-xs">Word not found</p>
            )}
          </div>
        )}

        {!loading && tab === 'en-en' && (
          <div className="space-y-2">
            {entry?.meanings.slice(0, 4).map((m, i) => (
              <div key={i}>
                <span className="text-xs text-gray-500 italic">{m.pos}</span>
                <p className="text-gray-200">{m.definition}</p>
                {m.example && (
                  <p className="text-gray-500 text-xs italic mt-0.5">"{m.example}"</p>
                )}
              </div>
            ))}
            {!entry && <p className="text-gray-500 text-xs">No definition found</p>}
          </div>
        )}

        {!loading && tab === 'en-vn' && (
          <div className="py-2">
            {translation ? (
              <p className="text-gray-200 text-base">{translation}</p>
            ) : (
              <p className="text-gray-500 text-xs">Translating…</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-700">
        <button
          onClick={handleAddToFlashcards}
          disabled={!entry || added}
          className="w-full btn-secondary py-1.5 text-xs disabled:opacity-40"
        >
          {added ? '✅ Added to flashcards!' : '+ Add to Flashcards'}
        </button>
      </div>
    </div>
  )
}

export default function DictionaryPopup(): JSX.Element | null {
  const [popup, setPopup] = useState<PopupState | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseUp(e: MouseEvent): void {
      const sel = window.getSelection()
      const word = sel?.toString().trim().replace(/[^a-zA-Z'\-]/g, '').trim()
      if (!word || word.length < 2 || word.split(' ').length > 4) return

      // Don't trigger inside the popup itself
      if (popupRef.current?.contains(e.target as Node)) return

      const x = Math.min(e.clientX, window.innerWidth - 300)
      const y = e.clientY + 10

      setPopup({ word, x, y })
    }

    function onMouseDown(e: MouseEvent): void {
      if (!popupRef.current?.contains(e.target as Node)) {
        setPopup(null)
      }
    }

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [])

  if (!popup) return null

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left: popup.x,
        top: Math.min(popup.y, window.innerHeight - 280),
        zIndex: 9999
      }}
    >
      <PopupContent word={popup.word} onClose={() => setPopup(null)} />
    </div>
  )
}
