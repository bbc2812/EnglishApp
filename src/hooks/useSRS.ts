import { useCallback } from 'react'
import { schedule, type Rating, type Card } from '../lib/srs/fsrs'
import { type FlashcardRow } from '../store/sessionStore'

export function useSRS() {
  const loadDueCards = useCallback(async (limit = 50): Promise<FlashcardRow[]> => {
    if (!window.api?.db) return []
    const today = new Date().toISOString().slice(0, 10)
    return window.api.db.all(
      `SELECT f.*, w.word, w.ipa, w.audio_url, w.definition, w.examples,
              w.mnemonic, w.source_sentence, w.source_url
        FROM flashcards f
        JOIN words w ON w.id = f.word_id
        WHERE f.due_date <= ?
        ORDER BY f.due_date ASC
        LIMIT ?`,
      [today, limit]
    ) as Promise<FlashcardRow[]>
  }, [])

  const loadVocabSetCards = useCallback(async (vocabSetId: number, limit = 50): Promise<FlashcardRow[]> => {
    if (!window.api?.db) return []
    return window.api.db.all(
      `SELECT f.id, f.word_id, f.due_date, f.stability, f.difficulty,
              f.elapsed_days, f.scheduled_days, f.reps, f.lapses, f.state, f.last_review,
              w.word, w.ipa, w.audio_url, w.definition, w.examples,
              w.mnemonic, w.source_sentence, w.source_url
        FROM vocab_set_words vsw
        JOIN words w ON w.id = vsw.word_id
        LEFT JOIN flashcards f ON f.word_id = w.id
        WHERE vsw.vocab_set_id = ?
        ORDER BY CASE WHEN f.state = 'new' THEN 0 WHEN f.state = 'learning' THEN 1 WHEN f.state = 'review' THEN 2 WHEN f.state = 'relearning' THEN 3 ELSE 4 END,
                 f.due_date ASC
        LIMIT ?`,
      [vocabSetId, limit]
    ) as Promise<FlashcardRow[]>
  }, [])

  const applyRating = useCallback(async (card: FlashcardRow, rating: Rating) => {
    if (!window.api?.db) return schedule(card as unknown as Card, rating)
    const result = schedule(card as unknown as Card, rating)
    await window.api.db.run(
      `UPDATE flashcards SET
        due_date = ?, stability = ?, difficulty = ?,
        elapsed_days = ?, scheduled_days = ?,
        reps = ?, lapses = ?, state = ?, last_review = ?
       WHERE id = ?`,
      [
        result.due_date,
        result.stability,
        result.difficulty,
        result.elapsed_days,
        result.scheduled_days,
        result.reps,
        result.lapses,
        result.state,
        result.last_review,
        card.id
      ]
    )
    return result
  }, [])

  const addWordToFlashcards = useCallback(async (wordId: number) => {
    if (!window.api?.db) return
    await window.api.db.run(
      `INSERT OR IGNORE INTO flashcards (word_id, due_date, state)
       VALUES (?, date('now'), 'new')`,
      [wordId]
    )
  }, [])

  const generateMnemonic = useCallback(async (word: string): Promise<string> => {
    // Simulated mnemonic generation (real version would call AI API)
    const mnemonics: Record<string, string> = {
      'bizarre': 'BI-ZARRE — Imagine TWO bizarre stars dancing together. "Bi" = two, "zarre" sounds like "star". Two stars dancing = bizarre!',
      'eloquent': 'E-LOK-WENT — An "eloquent" speaker has "elo"quence flowing like a river. Think "ELON MUSK" speaking eloquently.',
      'perseverance': 'PER-SAY-VER-ANCE — "Per" = through, "say" = words, "ver" = very, "ance" = dance. Through words, very dance-like persistence.',
      'eloquence': 'E-LOK-WENT-S — Same root as eloquent. The "s" makes it the noun form.',
    }
    return mnemonics[word.toLowerCase()] || `💡 Mnemonic for "${word}": Think of a vivid image or story that connects the sound of "${word}" to its meaning.`
  }, [])

  const saveMnemonic = useCallback(async (wordId: number, mnemonic: string) => {
    if (!window.api?.db) return
    await window.api.db.run(
      `UPDATE words SET mnemonic = ? WHERE id = ?`,
      [mnemonic, wordId]
    )
  }, [])

  return { loadDueCards, loadVocabSetCards, applyRating, addWordToFlashcards, generateMnemonic, saveMnemonic }
}
