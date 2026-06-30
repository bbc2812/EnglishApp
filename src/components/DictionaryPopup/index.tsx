import { useEffect, useRef, useState, useCallback } from 'react'
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

function WordChips({ words, onClick }: { words: string[]; onClick: (word: string) => void }) {
  if (words.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {words.map((w, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); onClick(w) }}
          className="text-xs bg-brand-950/30 text-brand-300 px-2 py-0.5 rounded-full hover:bg-brand-950/50 hover:text-brand-200 transition-colors border border-brand-800/30"
          title="Click to look up"
        >
          {w}
        </button>
      ))}
    </div>
  )
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
  const [wordNetwork, setWordNetwork] = useState<{ synonyms: string[]; associations: string[] }>({ synonyms: [], associations: [] })
  const [networkLoading, setNetworkLoading] = useState(false)
  const { lookup, translate, fetchWordNetwork } = useDictionary()
  const { addWordToFlashcards } = useSRS()

  const handleLookupNewWord = useCallback((newWord: string) => {
    const el = document.createElement('span')
    el.textContent = newWord
    document.body.appendChild(el)
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    document.body.removeChild(el)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setWordNetwork({ synonyms: [], associations: [] })
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

  useEffect(() => {
    if (tab === 'en-en' && entry && !networkLoading) {
      setNetworkLoading(true)
      fetchWordNetwork(word).then((network) => {
        setWordNetwork(network)
        setNetworkLoading(false)
      })
    }
  }, [tab, word, entry, fetchWordNetwork, networkLoading])

  async function handleAddToFlashcards(): Promise<void> {
    if (!entry) return
    const existing = await window.api.db.query(
      'SELECT id FROM words WHERE word = ?',
      [entry.word]
    ) as { id: number } | undefined

    let wordId: number
    if (existing) {
      wordId = existing.id
      await window.api.db.run(
        `UPDATE words SET source_sentence = ?, source_url = ?, source_context = ? WHERE id = ?`,
        [entry.meanings[0]?.definitions[0]?.example ?? null, null, 'Dictionary lookup', wordId]
      )
    } else {
      const examples = entry.meanings.flatMap((m) => m.definitions.flatMap((d) => (d.example ? [d.example] : [])))
      const res = await window.api.db.run(
        `INSERT INTO words (word, ipa, audio_url, definition, examples, source_sentence, source_context)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.word,
          entry.phonetics[0]?.ipa ?? entry.phonetic,
          entry.phonetics[0]?.audio,
          entry.meanings[0]?.definitions[0]?.definition ?? null,
          JSON.stringify([...new Set(examples)].slice(0, 5)),
          entry.meanings[0]?.definitions[0]?.example ?? null,
          'Dictionary lookup'
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
    <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl w-80 text-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white truncate">{entry?.word || word}</span>
          {entry && entry.phonetics && entry.phonetics.length > 0 && (
            <span className="text-brand-400 font-mono text-xs flex-shrink-0">
              /{entry.phonetics[0].ipa}/
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white ml-2 flex-shrink-0 transition-colors">
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors border-b-2 ${
              tab === t.id
                ? 'text-brand-400 border-brand-400 bg-brand-950/10'
                : 'text-gray-500 hover:text-gray-300 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 min-h-[200px] max-h-[350px] overflow-y-auto selectable">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex gap-1 mb-2">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-gray-500 text-xs">Looking up…</p>
          </div>
        )}

        {!loading && tab === 'pronounce' && (
          <div className="space-y-4 py-1">
            {!entry ? (
              <p className="text-gray-500 text-xs text-center">Word not found</p>
            ) : entry.phonetics?.length === 0 ? (
              <p className="text-gray-500 text-xs text-center">Pronunciation not available</p>
            ) : entry.phonetics?.length ? (
              <>
                {entry.phonetic && (
                  <p className="text-center text-brand-400 font-mono text-lg">/{entry.phonetic}/</p>
                )}

                {entry.phonetics.map((p, i) => (
                  <div key={i} className="flex items-center justify-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      p.region === 'US' ? 'bg-red-950/30 text-red-400 border border-red-800/30' : 'bg-blue-950/30 text-blue-400 border border-blue-800/30'
                    }`}>
                      {p.region === 'US' ? '🇺🇸 US' : '🇬🇧 UK'}
                    </span>
                    <button
                      onClick={() => playAudio(p.audio)}
                      className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      🔊 Play {p.region}
                    </button>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        )}

        {!loading && tab === 'en-en' && (
          <div className="space-y-3">
            {entry?.meanings?.slice(0, 6).map((m, i) => (
              <div key={i}>
                <span className="text-xs text-brand-400 font-semibold italic mb-1 block">{m.pos}</span>
                <div className="space-y-2">
                  {m.definitions.slice(0, 3).map((d, j) => (
                    <div key={j} className="relative pl-3 border-l-2 border-gray-700">
                      <p className="text-gray-200 text-xs leading-relaxed">{d.definition}</p>
                      {d.example && (
                        <p className="text-gray-500 text-[10px] italic mt-0.5">"{d.example}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {(entry?.allSynonyms?.length ?? 0) > 0 && entry && (
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Synonyms</p>
                <WordChips words={entry.allSynonyms} onClick={handleLookupNewWord} />
              </div>
            )}

            {(entry?.allAntonyms?.length ?? 0) > 0 && entry && (
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Antonyms</p>
                <WordChips words={entry.allAntonyms} onClick={handleLookupNewWord} />
              </div>
            )}

            {wordNetwork.synonyms.length > 0 && !entry && (
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Word Network</p>
                <WordChips words={wordNetwork.synonyms} onClick={handleLookupNewWord} />
              </div>
            )}

            {wordNetwork.associations.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Word Associations</p>
                <WordChips words={wordNetwork.associations} onClick={handleLookupNewWord} />
              </div>
            )}

            {networkLoading && (
              <p className="text-gray-600 text-[10px] text-center">Loading word network…</p>
            )}

            {!entry && !networkLoading && (
              <p className="text-gray-500 text-xs">No definition found</p>
            )}
          </div>
        )}

        {!loading && tab === 'en-vn' && (
          <div className="py-1">
            {translation ? (
              <p className="text-gray-200 text-base">{translation}</p>
            ) : (
              <p className="text-gray-500 text-xs text-center">Translating…</p>
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

      if (popupRef.current?.contains(e.target as Node)) return

      const x = Math.min(e.clientX, window.innerWidth - 340)
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
        top: Math.min(popup.y, window.innerHeight - 400),
        zIndex: 9999
      }}
    >
      <PopupContent word={popup.word} onClose={() => setPopup(null)} />
    </div>
  )
}
