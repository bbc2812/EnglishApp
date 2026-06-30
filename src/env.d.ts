/// <reference types="vite/client" />

interface DbApi {
  query: (sql: string, params?: unknown[]) => Promise<unknown>
  run: (sql: string, params?: unknown[]) => Promise<{ changes: number; lastInsertRowid: number }>
  all: (sql: string, params?: unknown[]) => Promise<unknown[]>
}

interface AiApi {
  chat: (
    provider: string,
    messages: { role: string; content: string }[],
    system?: string,
    options?: { apiKey?: string; ollamaUrl?: string; ollamaModel?: string; geminiApiKey?: string }
  ) => Promise<string>
  isAvailable: (provider: string, options?: { ollamaUrl?: string }) => Promise<boolean>
  adaptArticle: (text: string, level: string, options?: { apiKey?: string; provider?: string }) => Promise<string>
  summarizeContent: (content: string, options?: { apiKey?: string; provider?: string }) => Promise<string>
}

interface ContentApi {
  fetchRss: (url: string) => Promise<unknown>
  fetchDictionary: (word: string) => Promise<unknown>
  fetchTranslation: (word: string) => Promise<string>
  fetchNewsAPI: (category?: string, apiKey?: string) => Promise<unknown[]>
  fetchBBCLE: (filter?: string) => Promise<unknown[]>
  fetchGuardianArticles: (topic?: string, page?: number) => Promise<unknown[]>
  fetchYouTubeRSS: (channelId?: string) => Promise<unknown>
  fetchYouTubeChannel: (channelId?: string) => Promise<unknown[]>
  fetchYouTubeSubtitles: (videoId: string) => Promise<{ sentences: { text: string; startTime: number; endTime: number }[]; language: string }>
  fetchYouTubeSubtitlesByLang: (videoId: string, langCode: string) => Promise<{ sentences: { text: string; startTime: number; endTime: number }[]; language: string }>
  parseManualTranscript: (text: string) => Promise<{ text: string; startTime: number; endTime: number }[]>
  fetchDatamuse: (query: string, relSyn?: string) => Promise<{ word: string; score: number }[]>
  fetchWiktionary: (word: string) => Promise<unknown>
  fetchCambridge: (word: string) => Promise<unknown>
  fetchQuotable: (limit?: number) => Promise<{ content: string; author: string }[]>
  fetchWordOfTheDay: () => Promise<{ word: string; url: string } | null>
  scrapeUrl: (url: string) => Promise<{ title: string; description: string; content: string }>
  saveYouTubeEpisode: (data: { videoId: string; title: string; channel: string; duration?: string; thumbnail?: string; publishedAt: string; level?: string }) => Promise<boolean>
  fetchWordNetwork: (word: string) => Promise<{ synonyms: string[]; associations: string[] }>
  generatePodcastTranscript: (title: string, description: string, options?: { apiKey?: string; provider?: string }) => Promise<{ sentences: { text: string; startTime: number; endTime: number }[]; totalDuration: number }>
  fetchPodcastEpisodes: () => Promise<any[]>
}

interface ShadowingApi {
  save: (attempt: {
    episodeType: 'podcast' | 'youtube' | 'imported_article'
    episodeId: string
    sentenceIndex: number
    sentenceText: string
    sentenceTranslation?: string
    nativeAudioUrl?: string
    matchScore: number
    phonemeFeedback: string
    attempts: number
    passed: number
    mode: 'learn' | 'free'
  }) => Promise<boolean>
  saveBatch: (attempts: {
    episodeType: 'podcast' | 'youtube' | 'imported_article'
    episodeId: string
    sentenceIndex: number
    sentenceText: string
    sentenceTranslation?: string
    nativeAudioUrl?: string
    matchScore: number
    phonemeFeedback: string
    attempts: number
    passed: number
    mode: 'learn' | 'free'
  }[]) => Promise<number>
  getProgress: (episodeType: string, episodeId: string) => Promise<{
    sentence_index: number
    best_score: number
    best_attempts: number
    passed: number
  }[]>
  getStats: (days?: number) => Promise<{
    totalSessions: number
    avgScore: number
    sentencesCompleted: number
    totalAttempts: number
  }>
  getWeakSentences: (episodeType: string, episodeId: string, threshold?: number) => Promise<{
    sentence_index: number
    sentence_text: string
    sentence_translation: string
    best_score: number
    best_attempts: number
  }[]>
  getHistory: (limit?: number) => Promise<{
    episode_type: string
    episode_id: string
    sentence_text: string
    match_score: number
    mode: string
    created_at: string
  }[]>
  analyzePronunciation: (request: {
    sentenceText: string
    targetPhonemes: { word: string; phoneme: string; difficulty: 'easy' | 'medium' | 'hard' }[]
    recordingDuration: number
    provider: string
    apiKey?: string
    geminiApiKey?: string
    ollamaUrl?: string
    ollamaModel?: string
  }) => Promise<{
    score: number
    phoneme_breakdown: { word: string; phoneme: string; issue: string | null; suggestion: string }[]
    overall_feedback: string
  }>
}

interface LearningApi {
  mark: (req: {
    type: 'video' | 'audio' | 'article' | 'lesson' | 'shadowing'
    itemId: string
    itemTitle: string
    source?: string
    cefrLevel?: string
  }) => Promise<{ toggled: boolean; nowLearnt: boolean }>
  getHistory: (options?: {
    search?: string
    type?: string
    cefrLevel?: string
    completed?: string
    sortBy?: string
    limit?: number
    offset?: number
  }) => Promise<{ items: { id: number; type: string; item_id: string; item_title: string; source: string | null; cefr_level: string | null; completed: number; completed_at: string | null; added_at: string }[]; total: number }>
  getStats: () => Promise<{
    total: number
    learnt: number
    todayLearnt: number
    thisWeekLearnt: number
    byType: { type: string; c: number }[]
    recentLearnt: { id: number; type: string; item_id: string; item_title: string; source: string | null; cefr_level: string | null; completed_at: string | null }[]
  }>
  getRecent: (limit?: number) => Promise<{
    type: string
    item_id: string
    item_title: string
    source: string | null
    cefr_level: string | null
    completed_at: string | null
  }[]>
  getByDate: () => Promise<{
    today: { id: number; type: string; item_id: string; item_title: string; source: string | null; cefr_level: string | null; completed_at: string | null }[]
    thisWeek: { id: number; type: string; item_id: string; item_title: string; source: string | null; cefr_level: string | null; completed_at: string | null }[]
    thisMonth: { id: number; type: string; item_id: string; item_title: string; source: string | null; cefr_level: string | null; completed_at: string | null }[]
    allTime: { id: number; type: string; item_id: string; item_title: string; source: string | null; cefr_level: string | null; completed_at: string | null }[]
  }>
  isLearnt: (type: string, itemId: string) => Promise<boolean>
}

interface ClipboardApi {
  capture: () => Promise<string>
  onCapture: (callback: (text: string) => void) => () => void
}

interface Window {
  api: {
    db: DbApi
    ai: AiApi
    content: ContentApi
    shadowing: ShadowingApi
    learning: LearningApi
    clipboard: ClipboardApi
  }
}
