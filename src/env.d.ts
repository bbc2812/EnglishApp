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
  fetchDatamuse: (query: string, relSyn?: string) => Promise<{ word: string; score: number }[]>
  fetchWiktionary: (word: string) => Promise<unknown>
  fetchCambridge: (word: string) => Promise<unknown>
  fetchQuotable: (limit?: number) => Promise<{ content: string; author: string }[]>
  fetchWordOfTheDay: () => Promise<{ word: string; url: string } | null>
  scrapeUrl: (url: string) => Promise<{ title: string; description: string; content: string }>
  saveYouTubeEpisode: (data: { videoId: string; title: string; channel: string; duration?: string; thumbnail?: string; publishedAt: string; level?: string }) => Promise<boolean>
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
    clipboard: ClipboardApi
  }
}
