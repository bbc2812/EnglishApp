# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**WiseRain** — an Electron desktop app for English learning targeting C1/C2 fluency. Built for a Vietnamese speaker at B1/B2 level. See `PLAN.md` for the full feature specification and implementation roadmap.

## Commands

```bash
npm run dev          # Start Electron app in development (hot reload)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # TypeScript type check (no emit)
npm run lint         # ESLint
```

Once the project is scaffolded via `npm create @quick-start/electron@latest`, these are the standard electron-vite commands.

## Architecture

### Process split (Electron)

All code in `electron/` runs in the **main process** (Node.js, full OS access). All code in `src/` runs in the **renderer process** (browser sandbox). Communication between them is exclusively via IPC:

- `electron/preload.ts` exposes a typed `window.electron` API using `contextBridge`
- `electron/handlers/` contains the IPC handler implementations: `ai.ts`, `db.ts`, `audio.ts`, `content.ts`
- Renderer code never imports Node or Electron modules directly — everything goes through `window.electron.*`

### Data layer

SQLite via `better-sqlite3` + `drizzle-orm`, accessed only from the main process through IPC. Schema lives in `src/db/schema.ts` (imported by both sides for types), migrations run at startup via `src/db/migrate.ts`. All user progress, flashcard SRS state, dictionary cache, and conversation history persist locally.

Key tables: `words`, `flashcards` (SRS state), `units`, `lessons`, `exercises`, `lesson_progress`, `unit_progress`, `daily_stats`, `grammar_mistakes`, `dictionary_cache`, `translation_cache`, `conversations`, `writing_history`.

### AI provider abstraction

`src/lib/ai/index.ts` defines an `AIProvider` interface (`chat`, `isAvailable`). Two implementations:
- `ClaudeProvider` (`src/lib/ai/claude.ts`) — uses `@anthropic-ai/sdk`, requires API key in `settingsStore`
- `OllamaProvider` (`src/lib/ai/ollama.ts`) — HTTP fetch to `localhost:11434/api/chat`, fully offline

The active provider is selected in Settings and stored in `settingsStore`. All AI calls go through the `useAI` hook which picks the provider transparently.

### SRS (Spaced Repetition)

`src/lib/srs/fsrs.ts` implements the FSRS-4.5 algorithm. The core function is `schedule(card, rating, now)` returning an updated card with new `due_date`, `stability`, and `difficulty`. Ratings: Again=1, Hard=2, Good=3, Easy=4. Daily queue is fetched with `WHERE due_date <= today`.

### Click-to-define / translate

A global `mouseup` listener on `document` captures `window.getSelection()` and opens `DictionaryPopup`. The popup has three tabs: **Pronounce** (IPA + audio from Free Dictionary API), **EN-EN** (definition/examples), **EN-VN** (Vietnamese translation via MyMemory API). Both APIs are cached in SQLite indefinitely. This popup works on every page.

### Content fetching

All external HTTP calls (RSS feeds, dictionary API, translation API) happen in the main process via `electron/handlers/content.ts` to avoid CORS restrictions. Results are cached in SQLite. Content sources: VOA Learning English, BBC Learning English, The Guardian RSS, NPR, BBC 6 Minute English, TED Talks (all free, no auth).

### State management

Zustand stores in `src/store/`:
- `settingsStore` — API keys, active AI provider, Ollama model, daily word limit, theme
- `progressStore` — daily stats, current streak, aggregate unit progress
- `sessionStore` — active flashcard session (current card, queue, results)

### Roadmap / unit unlock

12 units mapped to CEFR levels (1-4: B1→B2, 5-8: B2→C1, 9-12: C1→C2). Unit 1 unlocked by default. A unit unlocks when `lesson_progress` records show ≥80% of the previous unit's lessons completed. Dashboard renders the roadmap as an SVG path with Framer Motion animations.

## Key conventions

- Renderer never calls Node/Electron APIs directly — always through `window.electron`
- Dictionary and translation responses are always cached before returning to renderer
- AI calls are non-blocking; show loading state in UI while awaiting
- Exercise results always write to `lesson_progress` on completion, which triggers unit unlock check
- Grammar mistakes detected by AI writing feedback are upserted into `grammar_mistakes` table (increment count)
