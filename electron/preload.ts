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
      system?: string
    ): Promise<string> => ipcRenderer.invoke('ai:chat', provider, messages, system),
    isAvailable: (provider: string): Promise<boolean> =>
      ipcRenderer.invoke('ai:isAvailable', provider)
  },
  content: {
    fetchRss: (url: string): Promise<unknown> => ipcRenderer.invoke('content:fetchRss', url),
    fetchDictionary: (word: string): Promise<unknown> =>
      ipcRenderer.invoke('content:fetchDictionary', word),
    fetchTranslation: (word: string): Promise<string> =>
      ipcRenderer.invoke('content:fetchTranslation', word)
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
