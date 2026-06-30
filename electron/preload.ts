import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  db: {
    query: (sql: string, params?: unknown[]): Promise<unknown> =>
      ipcRenderer.invoke('db:query', sql, params),
    run: (sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number }> =>
      ipcRenderer.invoke('db:run', sql, params),
    all: (sql: string, params?: unknown[]): Promise<unknown[]> =>
      ipcRenderer.invoke('db:all', sql, params)
  },
  ai: {
    chat: (
      provider: string,
      messages: { role: string; content: string }[],
      system?: string,
      options?: { apiKey?: string; ollamaUrl?: string; ollamaModel?: string; geminiApiKey?: string }
    ): Promise<string> => ipcRenderer.invoke('ai:chat', provider, messages, system, options),
    isAvailable: (provider: string, options?: { ollamaUrl?: string }): Promise<boolean> =>
      ipcRenderer.invoke('ai:isAvailable', provider, options),
    adaptArticle: (text: string, level: string, options?: { apiKey?: string; provider?: string }): Promise<string> =>
      ipcRenderer.invoke('ai:adaptArticle', text, level, options),
    summarizeContent: (content: string, options?: { apiKey?: string; provider?: string }): Promise<string> =>
      ipcRenderer.invoke('ai:summarizeContent', content, options)
  },
  content: {
    fetchRss: (url: string): Promise<unknown> => ipcRenderer.invoke('content:fetchRss', url),
    fetchDictionary: (word: string): Promise<unknown> =>
      ipcRenderer.invoke('content:fetchDictionary', word),
    fetchTranslation: (word: string): Promise<string> =>
      ipcRenderer.invoke('content:fetchTranslation', word),
    fetchNewsAPI: (category?: string, apiKey?: string): Promise<unknown[]> =>
      ipcRenderer.invoke('content:fetchNewsAPI', category, apiKey),
    fetchBBCLE: (filter?: string): Promise<unknown[]> =>
      ipcRenderer.invoke('content:fetchBBCLE', filter),
    fetchGuardianArticles: (topic?: string, page?: number): Promise<unknown[]> =>
      ipcRenderer.invoke('content:fetchGuardianArticles', topic, page),
    fetchYouTubeRSS: (channelId?: string): Promise<unknown> =>
      ipcRenderer.invoke('content:fetchYouTubeRSS', channelId),
    fetchYouTubeChannel: (channelId?: string): Promise<unknown[]> =>
      ipcRenderer.invoke('content:fetchYouTubeChannel', channelId),
    fetchYouTubeSubtitles: (videoId: string): Promise<{ text: string; startTime: number; endTime: number }[]> =>
      ipcRenderer.invoke('content:fetchYouTubeSubtitles', videoId),
    parseManualTranscript: (text: string): Promise<{ text: string; startTime: number; endTime: number }[]> =>
      ipcRenderer.invoke('content:parseManualTranscript', text),
    fetchDatamuse: (query: string, relSyn?: string): Promise<{ word: string; score: number }[]> =>
      ipcRenderer.invoke('content:fetchDatamuse', query, relSyn),
    fetchWiktionary: (word: string): Promise<unknown> =>
      ipcRenderer.invoke('content:fetchWiktionary', word),
    fetchCambridge: (word: string): Promise<unknown> =>
      ipcRenderer.invoke('content:fetchCambridge', word),
    fetchQuotable: (limit?: number): Promise<{ content: string; author: string }[]> =>
      ipcRenderer.invoke('content:fetchQuotable', limit),
    fetchWordOfTheDay: (): Promise<{ word: string; url: string } | null> =>
      ipcRenderer.invoke('content:fetchWordOfTheDay'),
    scrapeUrl: (url: string): Promise<{ title: string; description: string; content: string }> =>
      ipcRenderer.invoke('content:scrapeUrl', url),
    saveYouTubeEpisode: (data: { videoId: string; title: string; channel: string; duration?: string; thumbnail?: string; publishedAt: string; level?: string }): Promise<boolean> =>
      ipcRenderer.invoke('content:saveYouTubeEpisode', data)
  },
  shadowing: {
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
    }): Promise<boolean> =>
      ipcRenderer.invoke('shadowing:save', attempt),
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
    }[]): Promise<number> =>
      ipcRenderer.invoke('shadowing:saveBatch', attempts),
    getProgress: (episodeType: string, episodeId: string): Promise<{
      sentence_index: number
      best_score: number
      best_attempts: number
      passed: number
    }[]> =>
      ipcRenderer.invoke('shadowing:getProgress', episodeType, episodeId),
    getStats: (days?: number): Promise<{
      totalSessions: number
      avgScore: number
      sentencesCompleted: number
      totalAttempts: number
    }> =>
      ipcRenderer.invoke('shadowing:getStats', days),
    getWeakSentences: (episodeType: string, episodeId: string, threshold?: number): Promise<{
      sentence_index: number
      sentence_text: string
      sentence_translation: string
      best_score: number
      best_attempts: number
    }[]> =>
      ipcRenderer.invoke('shadowing:getWeakSentences', episodeType, episodeId, threshold),
    getHistory: (limit?: number): Promise<{
      episode_type: string
      episode_id: string
      sentence_text: string
      match_score: number
      mode: string
      created_at: string
    }[]> =>
      ipcRenderer.invoke('shadowing:getHistory', limit)
  },
  clipboard: {
    capture: (): Promise<string> =>
      ipcRenderer.invoke('clipboard:capture'),
    onCapture: (callback: (text: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, text: string) => callback(text)
      ipcRenderer.on('clipboard:capture', handler)
      return () => ipcRenderer.removeListener('clipboard:capture', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (global fallback for non-isolated contexts)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
