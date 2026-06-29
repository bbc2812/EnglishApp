import { useCallback } from 'react'
import { schedule, type Rating, type Card } from '../lib/srs/fsrs'
import { type FlashcardRow } from '../store/sessionStore'

export function useSRS() {
  const loadDueCards = useCallback(async (limit = 50): Promise<FlashcardRow[]> => {
    const today = new Date().toISOString().slice(0, 10)
    return window.api.db.all(
      `SELECT f.*, w.word, w.ipa, w.audio_url, w.definition, w.examples
       FROM flashcards f
       JOIN words w ON w.id = f.word_id
       WHERE f.due_date <= ?
       ORDER BY f.due_date ASC
       LIMIT ?`,
      [today, limit]
    ) as Promise<FlashcardRow[]>
  }, [])

  const applyRating = useCallback(async (card: FlashcardRow, rating: Rating) => {
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
    await window.api.db.run(
      `INSERT OR IGNORE INTO flashcards (word_id, due_date, state)
       VALUES (?, date('now'), 'new')`,
      [wordId]
    )
  }, [])

  return { loadDueCards, applyRating, addWordToFlashcards }
}
