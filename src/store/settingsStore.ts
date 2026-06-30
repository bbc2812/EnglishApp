import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AiProvider = 'claude' | 'ollama' | 'gemini'
export type ThemeMode = 'dark' | 'light' | 'auto'
export type ShadowingScoring = 'simulated' | 'ai'
export type ShadowingFeedbackLang = 'en' | 'vn' | 'both'

interface SettingsState {
  claudeApiKey: string
  ollamaUrl: string
  ollamaModel: string
  geminiApiKey: string
  activeProvider: AiProvider
  dailyNewWords: number
  bilingualGrammar: boolean
  onboardingComplete: boolean
  newsApiKey: string
  systemTray: boolean
  clipboardHotkey: boolean
  readingGoalMins: number
  theme: ThemeMode
  shadowingScoring: ShadowingScoring
  shadowingFeedbackLang: ShadowingFeedbackLang
  shadowingTargetScore: number
  setClaudeApiKey: (key: string) => void
  setOllamaUrl: (url: string) => void
  setOllamaModel: (model: string) => void
  setGeminiApiKey: (key: string) => void
  setActiveProvider: (p: AiProvider) => void
  setDailyNewWords: (n: number) => void
  setBilingualGrammar: (b: boolean) => void
  setOnboardingComplete: (b: boolean) => void
  setNewsApiKey: (key: string) => void
  setSystemTray: (show: boolean) => void
  setClipboardHotkey: (enable: boolean) => void
  setReadingGoalMins: (n: number) => void
  setTheme: (t: ThemeMode) => void
  setShadowingScoring: (s: ShadowingScoring) => void
  setShadowingFeedbackLang: (l: ShadowingFeedbackLang) => void
  setShadowingTargetScore: (n: number) => void
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
      onboardingComplete: true,
      newsApiKey: '733d0d9c99f84bdabd6decaf0525b25a',
      systemTray: true,
      clipboardHotkey: true,
      readingGoalMins: 15,
      theme: 'dark',
      shadowingScoring: 'simulated',
      shadowingFeedbackLang: 'both',
      shadowingTargetScore: 80,
      setClaudeApiKey: (claudeApiKey) => set({ claudeApiKey }),
      setOllamaUrl: (ollamaUrl) => set({ ollamaUrl }),
      setOllamaModel: (ollamaModel) => set({ ollamaModel }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setActiveProvider: (activeProvider) => set({ activeProvider }),
      setDailyNewWords: (dailyNewWords) => set({ dailyNewWords }),
      setBilingualGrammar: (bilingualGrammar) => set({ bilingualGrammar }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setNewsApiKey: (newsApiKey) => set({ newsApiKey }),
      setSystemTray: (systemTray) => set({ systemTray }),
      setClipboardHotkey: (clipboardHotkey) => set({ clipboardHotkey }),
      setReadingGoalMins: (readingGoalMins) => set({ readingGoalMins }),
      setTheme: (theme) => set({ theme }),
      setShadowingScoring: (shadowingScoring) => set({ shadowingScoring }),
      setShadowingFeedbackLang: (shadowingFeedbackLang) => set({ shadowingFeedbackLang }),
      setShadowingTargetScore: (shadowingTargetScore) => set({ shadowingTargetScore })
    }),
    { name: 'wiserain-settings' }
  )
)
