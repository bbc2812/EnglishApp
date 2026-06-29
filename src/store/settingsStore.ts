import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AiProvider = 'claude' | 'ollama'

interface SettingsState {
  claudeApiKey: string
  ollamaUrl: string
  ollamaModel: string
  activeProvider: AiProvider
  dailyNewWords: number
  theme: 'dark' | 'light'
  setClaudeApiKey: (key: string) => void
  setOllamaUrl: (url: string) => void
  setOllamaModel: (model: string) => void
  setActiveProvider: (p: AiProvider) => void
  setDailyNewWords: (n: number) => void
  setTheme: (t: 'dark' | 'light') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      claudeApiKey: '',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      activeProvider: 'claude',
      dailyNewWords: 20,
      theme: 'dark',
      setClaudeApiKey: (claudeApiKey) => set({ claudeApiKey }),
      setOllamaUrl: (ollamaUrl) => set({ ollamaUrl }),
      setOllamaModel: (ollamaModel) => set({ ollamaModel }),
      setActiveProvider: (activeProvider) => set({ activeProvider }),
      setDailyNewWords: (dailyNewWords) => set({ dailyNewWords }),
      setTheme: (theme) => set({ theme })
    }),
    { name: 'wiserain-settings' }
  )
)
