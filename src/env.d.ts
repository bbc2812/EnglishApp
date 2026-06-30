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
}

interface ContentApi {
  fetchRss: (url: string) => Promise<unknown>
  fetchDictionary: (word: string) => Promise<unknown>
  fetchTranslation: (word: string) => Promise<string>
}

interface Window {
  api: {
    db: DbApi
    ai: AiApi
    content: ContentApi
  }
}
