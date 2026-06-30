import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AiProvider = 'claude' | 'ollama' | 'gemini'

interface SettingsState {
  claudeApiKey: string
  ollamaUrl: string
  ollamaModel: string
  geminiApiKey: string
  activeProvider: AiProvider
  dailyNewWords: number
  bilingualGrammar: boolean
  onboardingComplete: boolean
  theme: 'dark' | 'light'
  setClaudeApiKey: (key: string) => void
  setOllamaUrl: (url: string) => void
  setOllamaModel: (model: string) => void
  setGeminiApiKey: (key: string) => void
  setActiveProvider: (p: AiProvider) => void
  setDailyNewWords: (n: number) => void
  setBilingualGrammar: (b: boolean) => void
  setOnboardingComplete: (b: boolean) => void
  setTheme: (t: 'dark' | 'light') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      claudeApiKey: '',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      geminiApiKey: '',
      activeProvider: 'claude',
      dailyNewWords: 20,
      bilingualGrammar: true,
      onboardingComplete: false,
      theme: 'dark',
      setClaudeApiKey: (claudeApiKey) => set({ claudeApiKey }),
      setOllamaUrl: (ollamaUrl) => set({ ollamaUrl }),
      setOllamaModel: (ollamaModel) => set({ ollamaModel }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setActiveProvider: (activeProvider) => set({ activeProvider }),
      setDailyNewWords: (dailyNewWords) => set({ dailyNewWords }),
      setBilingualGrammar: (bilingualGrammar) => set({ bilingualGrammar }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setTheme: (theme) => set({ theme })
    }),
    { name: 'wiserain-settings' }
  )
)
