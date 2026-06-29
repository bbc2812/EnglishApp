# Plan: WiseRain — Local English Learning Desktop App

## Context
Build a comprehensive offline-capable Electron desktop app for a Vietnamese-speaking user at B1/B2 level targeting C1/C2 fluency in 3 months. The app combines structured CEFR-aligned curriculum, spaced repetition vocabulary, pronunciation shadowing, listening/reading exercises, and an AI tutor — all in a single local desktop app with no mandatory internet requirement (AI features are optional online).

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Shell | Electron 31 | Desktop, offline, file-system access |
| Build | electron-vite 2 | Best DX for Electron+Vite combo |
| UI | React 18 + TypeScript | Component model, ecosystem |
| Styling | Tailwind CSS 3 + shadcn/ui | Fast, polished UI |
| Routing | React Router v6 | SPA navigation |
| State | Zustand | Lightweight, no boilerplate |
| DB | better-sqlite3 + drizzle-orm | Fast local SQLite |
| Audio playback | Howler.js | Cross-platform audio |
| Waveform | WaveSurfer.js | Waveform vis for shadowing |
| Animations | Framer Motion | Roadmap path animations |
| AI (cloud) | @anthropic-ai/sdk (Claude API) | Best reasoning/tutor — needs API key from console.anthropic.com |
| AI (free cloud) | @google/generative-ai (Gemini) | Free tier via Google AI Studio — no credit card needed |
| AI (local) | Ollama HTTP (localhost:11434) | Fully offline fallback |
| Dictionary | Free Dictionary API + local cache | IPA + audio, no auth needed |

---

## Directory Structure

```
EnglishApp/
├── electron/
│   ├── main.ts                 # App window, lifecycle
│   ├── preload.ts              # contextBridge IPC exposure
│   ├── db/
│   │   └── migrate.ts          # Schema + seed (runs on startup)
│   └── handlers/
│       ├── ai.ts               # Claude + Gemini + Ollama IPC handlers
│       ├── db.ts               # SQLite IPC handlers
│       └── content.ts          # HTTP content fetching (RSS, dictionary, translation)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── env.d.ts                # window.api type declarations
│   ├── index.css               # Tailwind base + custom components
│   ├── pages/
│   │   ├── Dashboard.tsx       # Roadmap + daily stats
│   │   ├── Flashcards.tsx      # SRS review session ✅ DONE
│   │   ├── Shadowing.tsx       # Listen + record + compare
│   │   ├── Listening.tsx       # Audio + comprehension Qs
│   │   ├── Reading.tsx         # Article + click-to-define
│   │   ├── Speaking.tsx        # AI conversation + opinion prompts
│   │   ├── Writing.tsx         # Essays + grammar drills
│   │   ├── News.tsx            # Newspaper feed
│   │   ├── Podcasts.tsx        # Podcast browser + player
│   │   ├── AITutor.tsx         # Chat interface
│   │   └── Settings.tsx        # API keys, provider toggle, daily limits
│   ├── components/
│   │   ├── Layout/Sidebar.tsx  # App sidebar navigation ✅ DONE
│   │   ├── DictionaryPopup/    # Click-any-word overlay ✅ DONE
│   │   ├── Roadmap/            # SVG path + unit nodes
│   │   ├── AudioPlayer/        # Speed control, progress bar
│   │   ├── Recorder/           # MediaRecorder, waveform
│   │   └── ChatMessage/        # AI tutor message bubbles
│   ├── hooks/
│   │   ├── useAI.ts            # Provider-agnostic AI hook
│   │   ├── useSRS.ts           # FSRS scheduling hook ✅ DONE
│   │   ├── useAudio.ts         # Howler playback hook
│   │   └── useDictionary.ts    # Dictionary lookup + cache hook ✅ DONE
│   ├── store/
│   │   ├── settingsStore.ts    # API keys, provider, preferences ✅ DONE
│   │   ├── progressStore.ts    # Daily stats, streaks ✅ DONE
│   │   └── sessionStore.ts     # Current flashcard session state ✅ DONE
│   ├── lib/
│   │   ├── srs/fsrs.ts         # FSRS-4.5 algorithm ✅ DONE
│   │   ├── ai/claude.ts        # Claude API provider
│   │   ├── ai/gemini.ts        # Gemini provider (free tier)
│   │   ├── ai/ollama.ts        # Ollama HTTP provider
│   │   └── ai/index.ts         # AIProvider interface + factory
│   └── db/                     # (types only — DB runs in main process)
├── assets/
│   └── wordlists/
│       ├── oxford5000.csv      # Oxford 5000 word list
│       └── academic.csv        # Academic Word List
├── PLAN.md                     # This file
├── CLAUDE.md                   # Architecture guide for Claude Code
├── electron.vite.config.ts
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── tailwind.config.ts
└── package.json
```

---

## Build Status

| Phase | Status | Commit |
|---|---|---|
| Phase 1+2 — Scaffold + DB schema | ✅ Done | bc3ea1b |
| Phase 3 — Flashcard engine (FSRS-4.5) | ✅ Done | fe8af27 |
| Phase 4 — Dictionary popup (EN-EN + EN-VN) | ✅ Done | fe8af27 |
| Phase 5 — Roadmap + unit unlock | 🔜 Next | — |
| Phase 6 — Listening & Reading module | ⏳ Pending | — |
| Phase 6b — Newspaper & Podcast module | ⏳ Pending | — |
| Phase 7 — Shadowing mode | ⏳ Pending | — |
| Phase 7b — Writing module | ⏳ Pending | — |
| Phase 8 — AI Tutor (Claude / Gemini / Ollama) | ⏳ Pending | — |
| Phase 9 — Settings & polish | ⏳ Pending | — |

---

## Database Schema (SQLite via better-sqlite3)

```sql
-- Curriculum
units          (id, title, cefr_level, unit_order, description, unlocked)
lessons        (id, unit_id, title, type, content_url, transcript, locked)
exercises      (id, lesson_id, question, options JSON, answer, type)

-- Vocabulary & SRS
words          (id, word, ipa, audio_url, definition, pos, examples JSON, level, unit_id)
flashcards     (id, word_id, due_date, stability, difficulty, elapsed_days, scheduled_days,
                reps, lapses, state, last_review)

-- Progress
lesson_progress  (id, lesson_id, completed_at, score)
unit_progress    (id, unit_id, percent_complete, unlocked_at)
daily_stats      (date TEXT PK, words_reviewed, new_words, listening_mins, speaking_mins, writing_mins, streak)
grammar_mistakes (id, type, description, count, last_seen)

-- Content (cached from internet)
saved_articles  (id, url, title, source, level, content, saved_at)
saved_podcasts  (id, url, title, source, duration, transcript JSON, saved_at)

-- AI
conversations   (id, type, provider, messages JSON, created_at)
writing_history (id, prompt, content, ai_feedback JSON, score, created_at)

-- Cache
dictionary_cache  (word TEXT PK, data JSON, fetched_at)
translation_cache (word TEXT PK, translation TEXT, fetched_at)
```

All 16 tables created via `electron/db/migrate.ts` which runs on every app startup (idempotent `CREATE TABLE IF NOT EXISTS`). 12 CEFR units are seeded with `INSERT OR IGNORE`.

---

## FSRS-4.5 Algorithm

Implemented in `src/lib/srs/fsrs.ts`:
- `schedule(card, rating)` → returns updated card with new `due_date`, `stability`, `difficulty`
- Ratings: `Again=1`, `Hard=2`, `Good=3`, `Easy=4`
- Uses published FSRS-4.5 w0–w18 default parameters
- Daily queue: `SELECT * FROM flashcards WHERE due_date <= today ORDER BY due_date LIMIT ?`

---

## AI Provider Abstraction

Three providers, all routed through `electron/handlers/ai.ts` via IPC:

```typescript
// Provider selection in settingsStore
type AiProvider = 'claude' | 'gemini' | 'ollama'
```

| Provider | Package | Key source | Cost |
|---|---|---|---|
| Claude | `@anthropic-ai/sdk` | console.anthropic.com | Paid per token |
| Gemini | `@google/generative-ai` | aistudio.google.com | **Free tier available** |
| Ollama | HTTP fetch | localhost:11434 | Free (local) |

> **Note:** Claude Pro (claude.ai subscription) does NOT give API access. The app requires a separate API key from console.anthropic.com. Use Gemini for a free cloud option.

**AI Tutor system prompt:**
```
You are an expert English tutor for a Vietnamese speaker at B1/B2 level aiming for C1/C2.
Correct grammar mistakes inline using [correction] format. Explain WHY each correction matters.
When the user asks about vocabulary, provide: definition, IPA, 3 example sentences, common
collocations, and note any Vietnamese false friends or tricky points. Be concise and encouraging.
```

---

## Roadmap System

- 12 units: 1-4 (B1→B2), 5-8 (B2→C1), 9-12 (C1→C2)
- Unit 1 unlocked by default; unlock next when `lesson_progress` shows ≥80% of current unit lessons done
- Dashboard renders SVG curved path connecting 12 unit node circles
- Framer Motion animates the path drawing on first render
- Each node shows: title, CEFR badge, lock icon (if locked), completion % ring

---

## Content Sources (all free)

| Source | Usage | Method |
|---|---|---|
| Free Dictionary API (`api.dictionaryapi.dev`) | EN-EN IPA, audio, definitions | HTTP GET, SQLite cache |
| MyMemory API | EN→VN translation | HTTP GET, SQLite cache |
| VOA Learning English | Listening + reading articles | RSS feed |
| BBC Learning English | Structured lessons + audio | RSS / HTTP |
| The Guardian | Real newspaper articles (C1/C2) | RSS |
| NPR News | Podcast transcripts + audio | RSS |
| BBC 6 Minute English | Podcast with transcript | RSS |
| TED Talks | Advanced listening | HTTP + transcript |
| Oxford 5000 list | Vocabulary curriculum | Bundled CSV |
| Academic Word List | Advanced vocab (C1/C2) | Bundled CSV |

**Click-to-define popup** (`src/components/DictionaryPopup/`) — global `mouseup` listener → 3 tabs:
- **Pronounce**: IPA + audio playback
- **EN-EN**: definition + examples
- **EN-VN**: Vietnamese translation (cached)
- **Add to Flashcards** button

---

## Writing Skill Module

- Daily AI-generated writing prompts (essay / email / opinion / IELTS Task 2)
- Grammar checker: inline color-coded corrections (red=error, yellow=suggestion, green=good)
- Vietnamese→English mistake tracker: top 10 recurring errors in `grammar_mistakes` table
- Model answer shown after submission
- Writing history browser (all past essays in SQLite)

Exercise types: sentence transformation, error detection drills, cloze tests, timed free writing.

---

## Newspaper & Podcast Module

**News page:** Guardian + VOA + BBC RSS → article list with AI-assigned level badges. Reader view with click-to-define. Unknown word highlighting. Bulk "Add to Flashcards".

**Podcasts page:** VOA + BBC 6min + NPR + TED → episode list + in-app player. Speed control (0.5x–2x), 10s rewind. Transcript panel with sync highlighting. Sentence-level loop + "Shadow this sentence" shortcut.

---

## Exercises (10 types)

| Type | Module |
|---|---|
| Multiple choice comprehension | Listening/Reading |
| Fill-in-the-blank cloze | Reading/Writing |
| Sentence reordering (drag) | Grammar |
| Error detection drill | Writing |
| Dictation | Listening |
| Sentence transformation | Grammar |
| Word form chains (noun/verb/adj/adv) | Vocabulary |
| Collocation matching | Vocabulary |
| Speaking prompt (60s record + AI eval) | Speaking |
| Debate/Opinion (AI takes opposite side) | Speaking |

---

## Remaining Implementation Phases

### Phase 5 — Roadmap + Units (next)
- `src/pages/Dashboard.tsx`: SVG roadmap with 12 nodes on a curved path
- Unit unlock check: query `lesson_progress`, if ≥80% complete → `UPDATE units SET unlocked=1`
- Framer Motion path-drawing animation on mount
- Unit node click → lesson list view

### Phase 6 — Listening & Reading Module
- `src/pages/Listening.tsx` + `src/pages/Reading.tsx`
- VOA/BBC RSS parsed in `electron/handlers/content.ts` (fetchRss already implemented)
- Howler.js audio player: speed control, 10s rewind, progress bar
- Transcript sync highlighting + click-to-define
- Exercise UI: MCQ, fill-in-blank, dictation, sentence reorder
- On completion → write `lesson_progress` → trigger unit unlock check

### Phase 6b — Newspaper & Podcast Module
- `src/pages/News.tsx`: RSS aggregator + article reader
- `src/pages/Podcasts.tsx`: episode browser + player with transcript sync
- "Shadow this sentence" → navigates to `/shadowing` with prefilled sentence

### Phase 7 — Shadowing Mode
- `src/pages/Shadowing.tsx`: MediaRecorder + WaveSurfer.js dual waveform
- Loop: play → record → compare → rate → next sentence
- Optional AI pronunciation feedback

### Phase 7b — Writing Module
- `src/pages/Writing.tsx`: timed essay UI + AI grammar analysis
- `grammar_mistakes` table: upsert on each AI correction
- Grammar drills: error detect, sentence transform, cloze

### Phase 8 — AI Tutor + Gemini support
- `src/pages/AITutor.tsx`: full chat UI with provider toggle
- Add `chatWithGemini()` to `electron/handlers/ai.ts` using `@google/generative-ai`
- Add `geminiApiKey` field to `settingsStore`
- Conversation persistence in `conversations` table

### Phase 9 — Settings & Polish
- `src/pages/Settings.tsx`: Claude key, Gemini key, Ollama URL/model, daily word limit
- Dashboard: live daily stats + streak counter
- Onboarding modal on first launch

---

## Verification Checklist

1. `npm run dev` → app opens, all 11 sidebar pages load
2. Flashcard session → cards show IPA + audio, FSRS updates on rating
3. Click any word → popup shows Pronounce / EN-EN / EN-VN tabs
4. Complete a lesson → unit unlocks on roadmap
5. News feed → articles load with level badges
6. Podcast player → transcript syncs, sentence loop works
7. Writing page → AI returns inline color-coded corrections
8. Grammar mistake counter increments on repeated errors
9. AI Tutor → Claude, Gemini, Ollama all respond correctly
10. Shadowing → dual waveforms displayed after recording
11. Settings → API keys save and AI features enable/disable gracefully

---

## Key npm Packages

```json
{
  "electron": "^31",
  "electron-vite": "^2",
  "react": "^18",
  "react-router-dom": "^6",
  "zustand": "^4",
  "better-sqlite3": "^11",
  "drizzle-orm": "^0.31",
  "@anthropic-ai/sdk": "^0.27",
  "@google/generative-ai": "^0.21",
  "tailwindcss": "^3",
  "@headlessui/react": "^2",
  "howler": "^2",
  "wavesurfer.js": "^7",
  "framer-motion": "^11",
  "csv-parse": "^5",
  "rss-parser": "^3",
  "cheerio": "^1",
  "dompurify": "^3"
}
```

## Resume Trigger

To continue in a new session: **"Continue building WiseRain — start Phase 5 (Roadmap)"**

Node.js setup required in WSL before any npm commands:
```bash
export NVM_DIR="$HOME/.nvm" && \. "$NVM_DIR/nvm.sh"
```
