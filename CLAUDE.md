# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**WiseRain** — an Electron desktop app for English learning targeting C1/C2 fluency. Built for a Vietnamese speaker at B1/B2 level. See `PLAN.md` for the full feature specification and implementation roadmap.

> **Full reference:** `PROJECT_REFERENCE.md` — detailed schema, IPC patterns, pending phases.

## Commands

```bash
npm run dev          # Start Electron app in development (hot reload)
npm run build        # Build for production
npm run start        # Preview production build
npm run typecheck    # TypeScript type check (node + web, run separately)
npm run lint         # ESLint
npm run format       # Prettier
```

## Architecture

### Process split (Electron)

All code in `electron/` runs in the **main process** (Node.js, full OS access). All code in `src/` runs in the **renderer process** (browser sandbox). Communication between them is exclusively via IPC:

- `electron/preload.ts` exposes `window.api` (typed via `src/env.d.ts`) using `contextBridge`
- `electron/handlers/` contains the IPC handler implementations: `db.ts`, `ai.ts`, `content.ts`
- Renderer code **never imports Node/Electron modules directly** — everything goes through `window.api.*`

### IPC Channel Naming

`ipcMain.handle('channel:name', ...)` ↔ `ipcRenderer.invoke('channel:name', ...)`
The preload wraps these as:
- `window.api.db.query(sql, params)` — returns single result
- `window.api.db.run(sql, params)` — returns `{ changes, lastInsertRowid }`
- `window.api.db.all(sql, params)` — returns rows array
- `window.api.ai.chat(provider, messages, system?)` — AI chat
- `window.api.ai.isAvailable(provider)` — check if provider is reachable
- `window.api.content.fetchRss(url)`, `fetchDictionary(word)`, `fetchTranslation(word)`

**Adding new IPC:** Add handler in `electron/handlers/*.ts`, register in `electron/main.ts`, add to `electron/preload.ts` `api` object, add types to `src/env.d.ts`.

### DB Schema

**Raw SQL only** — `drizzle-orm` is in `package.json` but **unused**. Schema is in `electron/db/migrate.ts` via `CREATE TABLE IF NOT EXISTS` + `INSERT OR IGNORE` for seeding. DB file is at `%APPDATA%/wiserain/data/wiserain.db` on Windows. SQLite is opened with WAL mode + foreign keys enabled.

**21 tables:** `units`, `lessons`, `exercises`, `words`, `flashcards`, `lesson_progress`, `unit_progress`, `daily_stats`, `grammar_mistakes`, `learning_progress`, `vocab_sets`, `vocab_set_words`, `dictionary_cache`, `translation_cache`, `saved_articles`, `saved_podcasts`, `youtube_episodes`, `clipboard_history`, `conversations`, `writing_history`, `achievements`, `user_xp`, `daily_challenges`, `leaderboard_personas`, `shadowing_sessions`.

**Seed data:** 12 CEFR units (B1→C2), 12 pre-seeded lessons (4 units × 3), 12 topical vocab sets, 10 achievements, 5 leaderboard personas, 5 daily challenge types. `unit_progress` rows auto-created for unlocked units.

### AI Providers (Implemented)

All **three** providers are coded: Claude, Gemini, and Ollama.

- `electron/handlers/ai.ts` routes `ai:chat` IPC:
  - **Claude:** `@anthropic-ai/sdk`, model `claude-sonnet-4-6` (paid, key from env or `settingsStore`)
  - **Gemini:** `@google/generative-ai`, model `gemini-2.0-flash` (free tier available)
  - **Ollama:** HTTP POST to `localhost:11434/api/chat`, stream=false (free, local, default model `llama3.2`)

Additional AI handlers: `ai:adaptArticle` (CEFR level adaptation), `ai:summarizeContent`, `ai:isAvailable`.

> Claude Pro (claude.ai subscription) ≠ API access. API keys are separate from console.anthropic.com.

Active provider (`'claude'` | `'ollama'` | `'gemini'`) is stored in `settingsStore`. All AI calls in the renderer go through `window.api.ai.chat(...)`.

### SRS (Spaced Repetition)

`src/lib/srs/fsrs.ts` — pure JS implementation of **FSRS-4.5** with w0-w18 default parameters. Core function: `schedule(card, rating)` → `{ due_date, stability, difficulty, ... }`. Ratings: `1=Again`, `2=Hard`, `3=Good`, `4=Easy`. States: `new`, `learning`, `review`, `relearning`.

Hooks: `src/hooks/useSRS.ts` — `loadDueCards()`, `loadVocabSetCards()`, `applyRating()`, `addWordToFlashcards()`.

### UI Components

- **DictionaryPopup** (`src/components/DictionaryPopup/`) — global `mouseup` listener, 3 tabs: Pronounce (IPA+audio), EN-EN (definition), EN-VN (translation via MyMemory API). "Add to Flashcards" button. Caches results in `dictionary_cache` / `translation_cache`. Word network (synonyms/associations) via Datamuse/Wiktionary.
- **ShadowingPlayer** (`src/components/ShadowingPlayer/`) — 701 lines, most complex component. 3 view modes (Learn, Free, Review). Audio waveform visualizer, speed selector, subtitle toggles (EN/VN/Both), advanced C1/C2 vocabulary highlighting (amber/rose), keyboard shortcuts. Supports podcast, YouTube, and imported article content.
- **LearningBadge** (`src/components/LearningBadge/`) — Toggle "Mark as Learnt" badge.
- **OnboardingModal** (`src/components/OnboardingModal/`) — 3-step wizard for first-launch setup.
- **Tailwind classes:** `.card`, `.btn-primary`, `.btn-secondary`, `.sidebar-link.active`, `.badge-b1`/`.badge-b2`/`.badge-c1`/`.badge-c2`
- **Brand palette:** `brand-400` = `#38bdf8` (sky blue), body bg = `bg-gray-950`
- **Fonts:** Inter (sans-serif), JetBrains Mono (monospace)
- **Vite alias:** `@renderer/*` → `src/*`
- **Router:** React Router `HashRouter` — 15 routes, all in `src/App.tsx`
- **Custom component classes in:** `src/index.css`

### State Management

Zustand stores in `src/store/`:
- `settingsStore` — **persisted** (localStorage `wiserain-settings`): API keys (Claude/Gemini/Ollama), active AI provider, Ollama URL/model, daily word limit, theme, shadowing scoring mode, onboarding flag, notification settings
- `progressStore` — units array (from DB via `loadUnits()`), daily stats, today's XP
- `sessionStore` — active flashcard session: queue, currentIndex, results, isFlipped, queueSource/type/id

### Unit Progress & Unlock

`src/hooks/useUnitProgress.ts` — calculates unit completion from `lesson_progress` (score ≥ 80 counts), updates `unit_progress`, checks if next unit should unlock (≥80% threshold).

## Key Conventions

- **Renderer never calls Node/Electron APIs directly** — always through `window.api`
- **DB types are in `src/env.d.ts`** — add new IPC channels here for type safety
- **Typecheck runs separately:** `npm run typecheck:node` (tsconfig.node.json) then `npm run typecheck:web` (tsconfig.web.json) — do not combine
- **ESLint:** uses `@electron-toolkit/eslint-config-ts` — no local `.eslintrc.cjs`
- **`postcss.config.js`** is ESM — may produce "Reparsing as ES module" warning; harmless
- **DB migration is idempotent:** `CREATE TABLE IF NOT EXISTS` + `INSERT OR IGNORE`
- **`settingsStore` uses `persist()` middleware** — changes survive restarts
- **Dictionary/translation responses cached before returning to renderer**
- **Exercise results always write to `lesson_progress` on completion, triggers unit unlock check**
- **Grammar mistakes detected by AI writing feedback are upserted into `grammar_mistakes` table**
