export type AiProvider = 'claude' | 'ollama' | 'gemini';
export type ThemeMode = 'dark' | 'light' | 'auto';
interface SettingsState {
    claudeApiKey: string;
    ollamaUrl: string;
    ollamaModel: string;
    geminiApiKey: string;
    activeProvider: AiProvider;
    dailyNewWords: number;
    bilingualGrammar: boolean;
    onboardingComplete: boolean;
    newsApiKey: string;
    systemTray: boolean;
    clipboardHotkey: boolean;
    readingGoalMins: number;
    theme: ThemeMode;
    setClaudeApiKey: (key: string) => void;
    setOllamaUrl: (url: string) => void;
    setOllamaModel: (model: string) => void;
    setGeminiApiKey: (key: string) => void;
    setActiveProvider: (p: AiProvider) => void;
    setDailyNewWords: (n: number) => void;
    setBilingualGrammar: (b: boolean) => void;
    setOnboardingComplete: (b: boolean) => void;
    setNewsApiKey: (key: string) => void;
    setSystemTray: (show: boolean) => void;
    setClipboardHotkey: (enable: boolean) => void;
    setReadingGoalMins: (n: number) => void;
    setTheme: (t: ThemeMode) => void;
}
export declare const useSettingsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<SettingsState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<SettingsState, SettingsState>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: SettingsState) => void) => () => void;
        onFinishHydration: (fn: (state: SettingsState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<SettingsState, SettingsState>>;
    };
}>;
export {};
