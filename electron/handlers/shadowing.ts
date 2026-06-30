import { ipcMain } from 'electron'
import { getDb } from './db'
import { chatWithClaude, chatWithGemini, chatWithOllama } from './ai'

interface AnalyzePronunciationRequest {
  sentenceText: string
  targetPhonemes: { word: string; phoneme: string; difficulty: 'easy' | 'medium' | 'hard' }[]
  recordingDuration: number
  provider: string
  apiKey?: string
  geminiApiKey?: string
  ollamaUrl?: string
  ollamaModel?: string
}

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

  // Get shadowing streak (consecutive days of practice)
  ipcMain.handle('shadowing:getStreak', async () => {
    const db = getDb()

    // Get all distinct dates where shadowing sessions occurred
    const rows = db.prepare(
      `SELECT DISTINCT date(created_at) as practice_date
       FROM shadowing_sessions
       WHERE created_at IS NOT NULL
       ORDER BY practice_date DESC`
    ).all() as { practice_date: string }[]

    if (rows.length === 0) return { streak: 0, dates: [] }

    const dates = rows.map(r => r.practice_date).sort()

    // Calculate consecutive day streak
    let streak = 1
    let currentDate = new Date(dates[dates.length - 1]) // most recent date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if the most recent practice was today or yesterday
    const diffMs = today.getTime() - currentDate.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 1) {
      streak = 0
    } else {
      for (let i = dates.length - 2; i >= 0; i--) {
        const prevDate = new Date(dates[i])
        prevDate.setHours(0, 0, 0, 0)
        const prevDiff = currentDate.getTime() - prevDate.getTime()
        const prevDiffDays = Math.round(prevDiff / (1000 * 60 * 60 * 24))

        if (prevDiffDays === 1) {
          streak++
          currentDate = prevDate
        } else {
          break
        }
      }
    }

    return { streak, dates: dates.slice(-30) }
  })

  // Analyze pronunciation using AI
  ipcMain.handle('shadowing:analyzePronunciation', async (_event, request: AnalyzePronunciationRequest) => {
    const { sentenceText, targetPhonemes, recordingDuration, provider, apiKey, geminiApiKey, ollamaUrl, ollamaModel } = request

    const phonemeContext = targetPhonemes.length > 0
      ? `\n\nTarget phonemes to focus on:\n${targetPhonemes.map(p => `- ${p.word}: ${p.phoneme} (difficulty: ${p.difficulty})`).join('\n')}`
      : ''

    const systemPrompt = `You are an expert English pronunciation coach for Vietnamese learners.

Analyze the user's pronunciation based on:
- Sentence: "${sentenceText}"
- Recording duration: ${recordingDuration}s
${phonemeContext}

Common Vietnamese speaker challenges to evaluate:
1. TH sounds: /θ/ (think, three) often becomes /s/ or /z/; /ð/ (this, that) often becomes /z/
2. R/L confusion: Vietnamese speakers often swap /r/ and /l/
3. V/W confusion: /v/ (very, love) replaced with /w/
4. Final consonants: Vietnamese adds schwa after plosives (cat → "cat-uh", bed → "bed-uh")
5. Word stress: Vietnamese is syllable-timed, English is stress-timed
6. Sentence rhythm: English has strong/weak syllable patterns
7. Intonation: English uses pitch changes for questions, emphasis, and emotion

Scoring rubric (0-100):
- Individual phoneme accuracy: 40 points
- Word stress and syllable emphasis: 15 points
- Sentence rhythm and fluency: 15 points
- Intonation pattern: 15 points
- Overall intelligibility: 15 points

For each word in the sentence, identify:
- The key phoneme(s) that are commonly difficult
- Whether the pronunciation was likely correct based on duration match
- Specific issue if detected
- Actionable suggestion for improvement

Return ONLY a valid JSON object with this exact structure:
{
  "score": number (0-100),
  "phoneme_breakdown": [
    {
      "word": "string",
      "phoneme": "string (IPA notation)",
      "issue": "string or null",
      "suggestion": "string"
    }
  ],
  "overall_feedback": "string"
}`

    const userMessage = `Please analyze the pronunciation of this sentence.

Sentence: "${sentenceText}"
Recording duration: ${recordingDuration}s${phonemeContext}

Based on the recording duration compared to natural speech patterns for this sentence, analyze what the user likely said correctly and where they may have struggled. Pay special attention to the target phonemes listed above.`

    try {
      let result: string

      if (provider === 'claude') {
        const key = apiKey ?? process.env.ANTHROPIC_API_KEY ?? ''
        result = await chatWithClaude(key, [{ role: 'user', content: userMessage }], systemPrompt)
      } else if (provider === 'gemini') {
        const key = geminiApiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ''
        result = await chatWithGemini(key, [{ role: 'user', content: userMessage }], systemPrompt)
      } else {
        const baseUrl = ollamaUrl ?? 'http://localhost:11434'
        const model = ollamaModel ?? 'llama3.2'
        result = await chatWithOllama(baseUrl, model, [{ role: 'user', content: userMessage }], systemPrompt)
      }

      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 70,
          phoneme_breakdown: Array.isArray(parsed.phoneme_breakdown) ? parsed.phoneme_breakdown : [],
          overall_feedback: typeof parsed.overall_feedback === 'string' ? parsed.overall_feedback : result
        }
      }

      return {
        score: 70,
        phoneme_breakdown: [],
        overall_feedback: result
      }
    } catch (error) {
      return {
        score: 70,
        phoneme_breakdown: [],
        overall_feedback: 'AI analysis unavailable. Try again later.'
      }
    }
  })
}
