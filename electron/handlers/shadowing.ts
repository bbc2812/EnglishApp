import { ipcMain } from 'electron'
import { getDb } from './db'

interface ShadowingAttempt {
  episodeType: 'podcast' | 'youtube' | 'imported_article'
  episodeId: string
  sentenceIndex: number
  sentenceText: string
  sentenceTranslation?: string
  nativeAudioUrl?: string
  userAudioBlob?: Buffer
  matchScore: number
  phonemeFeedback: string
  attempts: number
  passed: number
  mode: 'learn' | 'free'
}

export function registerShadowingHandlers(): void {
  // Save a shadowing attempt
  ipcMain.handle('shadowing:save', async (_event, attempt: ShadowingAttempt) => {
    const db = getDb()
    db.prepare(
      `INSERT INTO shadowing_sessions (
        episode_type, episode_id, sentence_index, sentence_text, sentence_translation,
        native_audio_url, user_audio_blob, match_score, phoneme_feedback,
        attempts, passed, mode, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      attempt.episodeType,
      attempt.episodeId,
      attempt.sentenceIndex,
      attempt.sentenceText,
      attempt.sentenceTranslation ?? '',
      attempt.nativeAudioUrl ?? '',
      attempt.userAudioBlob ?? null,
      attempt.matchScore,
      attempt.phonemeFeedback ?? '',
      attempt.attempts,
      attempt.passed,
      attempt.mode
    )
    return true
  })

  // Save batch of shadowing attempts (bulk insert)
  ipcMain.handle('shadowing:saveBatch', async (_event, attempts: ShadowingAttempt[]) => {
    const db = getDb()
    const insert = db.prepare(
      `INSERT INTO shadowing_sessions (
        episode_type, episode_id, sentence_index, sentence_text, sentence_translation,
        native_audio_url, user_audio_blob, match_score, phoneme_feedback,
        attempts, passed, mode, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    const transaction = db.transaction((attempts: ShadowingAttempt[]) => {
      for (const a of attempts) {
        insert.run(
          a.episodeType, a.episodeId, a.sentenceIndex, a.sentenceText,
          a.sentenceTranslation ?? '', a.nativeAudioUrl ?? '',
          a.userAudioBlob ?? null, a.matchScore, a.phonemeFeedback ?? '',
          a.attempts, a.passed, a.mode
        )
      }
    })
    transaction(attempts)
    return attempts.length
  })

  // Get shadowing progress for an episode
  ipcMain.handle('shadowing:getProgress', async (_event, episodeType: string, episodeId: string) => {
    const db = getDb()
    const rows = db.prepare(
      `SELECT sentence_index, MAX(match_score) as best_score,
              MAX(attempts) as best_attempts, MAX(passed) as passed
       FROM shadowing_sessions
       WHERE episode_type = ? AND episode_id = ?
       GROUP BY sentence_index
       ORDER BY sentence_index`
    ).all(episodeType, episodeId) as {
      sentence_index: number
      best_score: number
      best_attempts: number
      passed: number
    }[]

    return rows
  })

  // Get shadowing stats
  ipcMain.handle('shadowing:getStats', async (_event, days = 7) => {
    const db = getDb()

    const totalSessions = db.prepare(
      `SELECT COUNT(*) as total FROM shadowing_sessions
       WHERE created_at >= date('now', '-${days} days')`
    ).get() as { total: number }

    const avgScore = db.prepare(
      `SELECT AVG(match_score) as avg_score FROM shadowing_sessions
       WHERE created_at >= date('now', '-${days} days') AND match_score IS NOT NULL`
    ).get() as { avg_score: number }

    const sentencesCompleted = db.prepare(
      `SELECT COUNT(DISTINCT sentence_index) as count FROM shadowing_sessions
       WHERE created_at >= date('now', '-${days} days') AND passed = 1`
    ).get() as { count: number }

    const totalAttempts = db.prepare(
      `SELECT SUM(attempts) as total FROM shadowing_sessions
       WHERE created_at >= date('now', '-${days} days')`
    ).get() as { total: number }

    return {
      totalSessions: totalSessions.total,
      avgScore: Math.round(avgScore.avg_score || 0),
      sentencesCompleted: sentencesCompleted.count,
      totalAttempts: totalAttempts.total || 0
    }
  })

  // Get weak sentences (score below threshold) for review
  ipcMain.handle('shadowing:getWeakSentences', async (_event, episodeType: string, episodeId: string, threshold = 80) => {
    const db = getDb()
    const rows = db.prepare(
      `SELECT sentence_index, sentence_text, sentence_translation,
              MAX(match_score) as best_score, MAX(attempts) as best_attempts
       FROM shadowing_sessions
       WHERE episode_type = ? AND episode_id = ? AND match_score < ?
       GROUP BY sentence_index
       ORDER BY best_score ASC`
    ).all(episodeType, episodeId, threshold) as {
      sentence_index: number
      sentence_text: string
      sentence_translation: string
      best_score: number
      best_attempts: number
    }[]

    return rows
  })

  // Get shadowing history (recent sessions)
  ipcMain.handle('shadowing:getHistory', async (_event, limit = 20) => {
    const db = getDb()
    const rows = db.prepare(
      `SELECT episode_type, episode_id, sentence_text, match_score, mode, created_at
       FROM shadowing_sessions
       ORDER BY created_at DESC
       LIMIT ?`
    ).all(limit) as {
      episode_type: string
      episode_id: string
      sentence_text: string
      match_score: number
      mode: string
      created_at: string
    }[]

    return rows
  })
}
