# PROJECT_REFERENCE.md — WiseRain Complete Reference

> **Purpose:** Single source of truth for AI agents. If AGENTS.md or CLAUDE.md conflicts with this file, this file is correct.

---

## File Locations

| File | Purpose |
|---|---|
| `PLAN.md` | Feature spec, roadmap, implementation phases |
| `electron/db/migrate.ts` | **DB schema + seed data** (NOT `src/db/`) |
| `electron/preload.ts` | `window.api` exposure — **add new IPC here + in `src/env.d.ts`** |
| `src/env.d.ts` | TypeScript types for `window.api` |
| `electron/handlers/db.ts` | DB IPC handlers + singleton `getDb()` |
| `electron/handlers/ai.ts` | AI chat handlers (Claude + Ollama) |
| `electron/handlers/content.ts` | RSS, dictionary, translation handlers |
| `electron/main.ts` | Electron main entry, window creation, handler registration |
| `src/App.tsx` | Router, layout, all routes |
| `src/index.css` | Tailwind base, component classes (`.card`, `.btn-primary`, `.sidebar-link`, etc.) |
| `tailwind.config.ts` | Brand colors, fonts (Inter, JetBrains Mono) |

---

## DB Schema (from `electron/db/migrate.ts`)

### 17 Tables (idempotent CREATE IF NOT EXISTS)

```sql
-- Curriculum
units           (id, title, cefr_level, unit_order, description, unlocked DEFAULT 0)
lessons         (id, unit_id FK, title, type: listening|reading|speaking|writing, content_url, transcript, locked DEFAULT 1)
exercises       (id, lesson_id FK, question, options TEXT, answer, type: mcq|fill|reorder|dictation|transform|error_detect|free)

-- Vocabulary & SRS
words           (id, word UNIQUE, ipa, audio_url, definition, pos, examples TEXT, level, unit_id FK)
flashcards      (id, word_id FK UNIQUE, due_date, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review)

-- Progress
lesson_progress  (id, lesson_id FK, completed_at, score DEFAULT 0)
unit_progress    (id, unit_id FK UNIQUE, percent_complete DEFAULT 0, unlocked_at)
daily_stats      (date PK, words_reviewed, new_words, listening_mins, speaking_mins, writing_mins, streak)
grammar_mistakes (id, type, description, count, last_seen)

-- Topical Vocab
vocab_sets       (id, title, topic, level, description, unit_id FK)
vocab_set_words  (id, vocab_set_id FK, word_id FK)

-- Content / Cache
saved_articles   (id, url UNIQUE, title, source, level, content, saved_at)
saved_podcasts   (id, url UNIQUE, title, source, duration, transcript TEXT, saved_at)
dictionary_cache  (word PK, data TEXT, fetched_at)
translation_cache (word PK, translation TEXT, fetched_at)

-- AI
conversations    (id, type: tutor|pronunciation|speaking|writing, provider, messages TEXT, created_at)
writing_history  (id, prompt, content, ai_feedback TEXT, score, created_at)
```

### Seed Data

- **12 units:** B1 (1-2) → B2 (3-4) → C1 (5-8) → C2 (9-12)
- **12 vocab sets:** Business Meetings, Travel, Technology, Academic Writing, Health, Phrasal Verbs, IELTS, News, Negotiations, Environment, Literary Terms, Legal
- **36 lessons:** 3 per unit (listening, reading, writing/speaking)
- Unit 1 "Foundations" unlocked by default
- `unit_progress` rows auto-created for unlocked units

### DB Gotchas

- **Raw SQL only** — `drizzle-orm` in package.json is **unused**
- DB file: `%APPDATA%/wiserain/data/wiserain.db` (Windows)
- Opened with `WAL` mode + `foreign_keys = ON`
- `getDb()` creates singleton, runs migrations on first access
- **Never commit `*.db` files** (gitignored)

---

## IPC Pattern

### Channel Naming

`ipcMain.handle('channel:name', ...)` ↔ `ipcRenderer.invoke('channel:name', ...)`

Preload wraps as `window.api.namespace.method()`.

### DB Channels

```typescript
// In preload.ts (electron/preload.ts)
window.api.db.query(sql, params)  // Returns single result (SELECT ... LIMIT 1)
window.api.db.run(sql, params)    // Returns { changes, lastInsertRowid }
window.api.db.all(sql, params)    // Returns rows array (SELECT ...)
```

**Renderer code:** `window.api.db.all(...)` — **NEVER** `import Database from 'better-sqlite3'` in `src/`

### AI Channels

```typescript
window.api.ai.chat(provider, messages, system?, options?)  // provider: 'claude' | 'ollama'
window.api.ai.isAvailable(provider, options?)
```

- **Claude:** `@anthropic-ai/sdk`, model `claude-sonnet-4-6`, max 2048 tokens
- **Ollama:** HTTP POST to `{baseUrl}/api/chat`, stream=false, default model `llama3.2`
- **Gemini:** in PLAN.md but **NOT implemented**

### Content Channels

```typescript
window.api.content.fetchRss(url)
window.api.content.fetchDictionary(word)  // Free Dictionary API
window.api.content.fetchTranslation(word) // MyMemory API (EN→VI)
```

### Adding New IPC

1. Add handler in `electron/handlers/` (e.g., `handler.ts`)
2. Register in `electron/main.ts`
3. Add to `electron/preload.ts` `api` object
4. Add TypeScript types to `src/env.d.ts`

---

## State Management (Zustand)

### settingsStore (`src/store/settingsStore.ts`)

**Persisted** to localStorage (`wiserain-settings`):
```typescript
interface SettingsState {
  claudeApiKey: string
  ollamaUrl: string           // default: http://localhost:11434
  ollamaModel: string         // default: llama3.2
  activeProvider: 'claude' | 'ollama'
  dailyNewWords: number       // default: 20
  theme: 'dark' | 'light'    // default: dark
}
```

### progressStore (`src/store/progressStore.ts`)

```typescript
interface ProgressState {
  todayStats: DailyStats | null    // date, wordsReviewed, newWords, listeningMins, speakingMins, writingMins, streak
  units: UnitProgress[]            // loaded from DB via loadUnits()
  todayXP: number
  loadUnits(): void                // JOIN units LEFT unit_progress
}
```

### sessionStore (`src/store/sessionStore.ts`)

```typescript
interface SessionState {
  queue: FlashcardRow[]
  currentIndex: number
  results: { cardId, rating }[]
  isFlipped: boolean
  queueSource: 'srs' | 'vocab_set'
  queueType: 'flashcards' | 'vocab_set'
  queueId: number | null
}
```

---

## SRS / Flashcards

### FSRS-4.5 (`src/lib/srs/fsrs.ts`)

- Pure JS, 19 weight parameters (w0-w18), published defaults
- `schedule(card, rating)` → `ScheduleResult` with `due_date`, `stability`, `difficulty`
- **Ratings:** `1=Again`, `2=Hard`, `3=Good`, `4=Easy`
- **States:** `new`, `learning`, `review`, `relearning`

### useSRS Hook (`src/hooks/useSRS.ts`)

```typescript
loadDueCards(limit)          // SELECT flashcards WHERE due_date <= today
loadVocabSetCards(setId)     // JOIN vocab_set_words → words → flashcards
applyRating(card, rating)    // schedule() + UPDATE flashcards
addWordToFlashcards(wordId)  // INSERT flashcard state='new'
```

### Flashcards Page (`src/pages/Flashcards.tsx`)

- Keyboard: `Space` = flip, `1-4` = rate
- Supports `?unit=N` for unit-specific sessions
- On complete: updates unit progress, checks unlock

### DictionaryPopup (`src/components/DictionaryPopup/`)

- Global `mouseup` listener → word selection → popup
- 3 tabs: Pronounce (IPA+audio), EN-EN, EN-VN
- "Add to Flashcards" → upserts word + creates flashcard
- Caches results in `dictionary_cache` / `translation_cache`

---

## Unit Progress & Unlock (`src/hooks/useUnitProgress.ts`)

```typescript
calculateUnitCompletion(unitId)  // % of lessons with score >= 80
updateUnitProgress(unitId)       // INSERT/UPDATE unit_progress
checkAndUnlockNext(unitId)       // If >= 80%, unlock next unit
unlockUnit(unitId)               // Manual unlock
completeLesson(lessonId, score)  // INSERT lesson_progress → update unit → check unlock
```

**Unlock rule:** When a unit reaches ≥80% lesson completion, next unit unlocks automatically.

---

## UI Conventions

### Tailwind Component Classes

| Class | Purpose |
|---|---|
| `.card` | `bg-gray-900 border border-gray-800 rounded-xl p-5` |
| `.btn-primary` | `bg-brand-600 hover:bg-brand-500 text-white` |
| `.btn-secondary` | `bg-gray-800 hover:bg-gray-700 text-gray-200` |
| `.sidebar-link` | `text-gray-400 hover:text-white hover:bg-white/5` |
| `.sidebar-link.active` | `text-white bg-white/10` |
| `.badge-b1` / `.badge-b2` / `.badge-c1` / `.badge-c2` | CEFR level badges |

### Brand Palette

- `brand-400` = `#38bdf8` (sky blue)
- Body bg: `bg-gray-950`
- Sidebar bg: `bg-gray-900`

### Fonts

- Sans: `Inter`, Mono: `JetBrains Mono`

### Vite Alias

- `@renderer/*` → `src/*`

### Router

- `HashRouter` (11 routes in `src/App.tsx`)
- Routes: `/`, `/flashcards`, `/listening`, `/reading`, `/shadowing`, `/speaking`, `/writing`, `/news`, `/podcasts`, `/tutor`, `/settings`

---

## Build & Commands

```bash
npm run dev           # Electron + hot reload
npm run build         # Production build (electron-vite)
npm run start         # Preview built app
npm run typecheck     # tsc -p tsconfig.node.json && tsc -p tsconfig.web.json (RUN SEPARATELY)
npm run lint          # ESLint
npm run format        # Prettier
npm run build:win     # Build + NSIS installer
npm run build:linux   # Build + AppImage/deb
```

### Typecheck Gotcha

Typecheck runs node and web **separately** — do not combine. Order matters.

### Electron Binary

On some systems: `node node_modules/electron/install.js` needed after `npm install`.

### PostCSS Warning

`postcss.config.js` is ESM — "Reparsing as ES module" warning is harmless.

---

## Code Patterns to Follow

### Adding a New Page

1. Create `src/pages/Name.tsx`
2. Add route in `src/App.tsx`
3. Add nav link in `src/components/Layout/Sidebar.tsx`

### Adding DB Tables

1. Add `CREATE TABLE IF NOT EXISTS` to `electron/db/migrate.ts` SCHEMA
2. Add `INSERT OR IGNORE` seed data to SEED_* string
3. Update `runMigrations()` to run new seed SQL
4. Add types to `src/env.d.ts` if exposing via IPC

### Adding AI Feature

1. Add handler in `electron/handlers/ai.ts`
2. Register in `electron/main.ts`
3. Add to `electron/preload.ts`
4. Add types to `src/env.d.ts`
5. Use `window.api.ai.*` in renderer

### Dictionary Popup Enhancement

The popup uses `useDictionary()` hook which:
- Checks `dictionary_cache` first
- Falls back to Free Dictionary API
- Caches results
- `useDictionary().translate()` for EN→VI via MyMemory

---

## Verification Checklist (from PLAN.md)

1. `npm run dev` → all 11 sidebar pages load
2. Flashcard back shows mnemonic + "first seen in" source sentence
3. Generate mnemonic button → AI returns memory story, saved to DB
4. Click any word → popup shows Pronounce / EN-EN / EN-VN tabs
5. Podcast player → dual subtitles toggle works (EN / EN+VN / VN)
6. Long article → "Quick Read" summary shows 5-8 key ideas
7. Complete a lesson → unit unlocks on roadmap
8. Shadowing → pronunciation match % shown, phoneme feedback panel
9. Writing page → corrections include Vietnamese explanation + top mistakes
10. AI Tutor → Claude, Gemini, Ollama respond; grammar replies bilingual
11. Complete activity → XP earned, sidebar XP bar updates
12. Unlock achievement → toast notification
13. Daily challenge card on Dashboard
14. Settings → API keys save, bilingual toggle persists

---

## Pending Phases

| Phase | Feature |
|---|---|
| 6 | Listening & Reading modules, context tracking |
| 6b | Newspaper, Podcast, Blinkist summaries, dual subtitles |
| 7 | Shadowing + ELSA-style pronunciation scoring |
| 7b | Writing module + Vietnamese grammar explanations |
| 3+ | Flashcard mnemonics + context display |
| 8 | AI Tutor (Claude / Gemini / Ollama) + bilingual mode |
| 9 | Settings, XP/Achievements, Daily Challenge, Polish |

---

## Quick Reference

| Task | Files to Edit |
|---|---|
| New DB table | `electron/db/migrate.ts`, `src/env.d.ts` |
| New IPC channel | `electron/handlers/*.ts`, `electron/main.ts`, `electron/preload.ts`, `src/env.d.ts` |
| New page | `src/pages/Name.tsx`, `src/App.tsx`, `src/components/Layout/Sidebar.tsx` |
| New Zustand store | `src/store/nameStore.ts`, import where used |
| New hook | `src/hooks/nameHook.ts`, import in component |
| Update AI handler | `electron/handlers/ai.ts` |
| Update SRS | `src/lib/srs/fsrs.ts`, `src/hooks/useSRS.ts` |
