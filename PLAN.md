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
| AI (cloud) | @anthropic-ai/sdk (Claude) | Best reasoning/tutor |
| AI (local) | Ollama HTTP (localhost:11434) | Fully offline fallback |
| Dictionary | Free Dictionary API + local cache | IPA + audio, no auth needed |

---

## Directory Structure

```
EnglishApp/
├── electron/
│   ├── main.ts                 # App window, lifecycle
│   ├── preload.ts              # contextBridge IPC exposure
│   └── handlers/
│       ├── ai.ts               # Claude + Ollama IPC handlers
│       ├── db.ts               # SQLite IPC handlers
│       ├── audio.ts            # File-based audio IPC
│       └── content.ts          # HTTP content fetching (VOA/BBC)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx       # Roadmap + daily stats
│   │   ├── Flashcards.tsx      # SRS review session
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
│   │   ├── Roadmap/            # SVG path + unit nodes
│   │   ├── FlashCard/          # Card flip, IPA, audio, rating buttons
│   │   ├── AudioPlayer/        # Speed control, progress bar
│   │   ├── Recorder/           # MediaRecorder, waveform
│   │   ├── DictionaryPopup/    # Click-any-word overlay (Pronounce/EN-EN/EN-VN tabs)
│   │   └── ChatMessage/        # AI tutor message bubbles
│   ├── hooks/
│   │   ├── useAI.ts            # Provider-agnostic AI hook
│   │   ├── useSRS.ts           # FSRS scheduling hook
│   │   ├── useAudio.ts         # Howler playback hook
│   │   └── useDictionary.ts    # Dictionary lookup + cache hook
│   ├── store/
│   │   ├── settingsStore.ts    # API keys, provider, preferences
│   │   ├── progressStore.ts    # Daily stats, streaks
│   │   └── sessionStore.ts     # Current flashcard session state
│   ├── lib/
│   │   ├── srs/fsrs.ts         # FSRS-4.5 algorithm implementation
│   │   ├── ai/claude.ts        # Claude API provider
│   │   ├── ai/ollama.ts        # Ollama HTTP provider
│   │   ├── ai/index.ts         # AIProvider interface + factory
│   │   └── phonetics.ts        # IPA display utilities
│   └── db/
│       ├── schema.ts           # Drizzle schema definitions
│       ├── migrate.ts          # Migration runner
│       └── queries/            # typed query functions per domain
├── assets/
│   └── wordlists/
│       ├── oxford5000.csv      # Oxford 5000 word list
│       └── academic.csv        # Academic Word List
├── PLAN.md                     # This file
├── electron.vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## Database Schema (SQLite via Drizzle)

```sql
-- Curriculum
units          (id, title, cefr_level, order, description, unlocked)
lessons        (id, unit_id, title, type ENUM(listening|reading|speaking|writing), content_url, transcript, locked)
exercises      (id, lesson_id, question, options JSON, answer, type ENUM(mcq|fill|reorder|dictation|transform|error_detect|free))

-- Vocabulary & SRS
words          (id, word, ipa, audio_url, definition, pos, examples JSON, level, unit_id)
flashcards     (id, word_id, due_date, stability, difficulty, elapsed_days, scheduled_days,
                reps, lapses, state ENUM(new|learning|review|relearning), last_review)

-- Progress
lesson_progress  (id, lesson_id, completed_at, score)
unit_progress    (id, unit_id, percent_complete, unlocked_at)
daily_stats      (date TEXT PK, words_reviewed, new_words, listening_mins, speaking_mins, writing_mins, streak)
grammar_mistakes (id, type, description, count, last_seen)

-- Content (cached from internet)
saved_articles  (id, url, title, source, level, content, saved_at)
saved_podcasts  (id, url, title, source, duration, transcript JSON, saved_at)

-- AI
conversations   (id, type ENUM(tutor|pronunciation|speaking|writing), provider, messages JSON, created_at)
writing_history (id, prompt, content, ai_feedback JSON, score, created_at)

-- Cache
dictionary_cache  (word TEXT PK, data JSON, fetched_at)
translation_cache (word TEXT PK, translation TEXT, fetched_at)
```

---

## FSRS-4.5 Algorithm

Implement `src/lib/srs/fsrs.ts` with:
- `schedule(card, rating, now)` → returns updated card with new `due_date`, `stability`, `difficulty`
- Ratings: `Again=1`, `Hard=2`, `Good=3`, `Easy=4`
- Use the published FSRS-4.5 parameters (w0–w19)
- Daily queue: `SELECT * FROM flashcards WHERE due_date <= today ORDER BY due_date LIMIT ?`

---

## AI Provider Abstraction (`src/lib/ai/index.ts`)

```typescript
interface AIProvider {
  chat(messages: Message[], system?: string): Promise<string>
  isAvailable(): Promise<boolean>
}
class ClaudeProvider implements AIProvider  // uses @anthropic-ai/sdk
class OllamaProvider implements AIProvider  // uses fetch to localhost:11434/api/chat
```

Settings page lets user: enter Claude API key, choose Ollama model (llama3.2, mistral, etc.), set default provider.

**AI Tutor system prompt** (saved in `settingsStore`):
```
You are an expert English tutor for a Vietnamese speaker at B1/B2 level aiming for C1/C2.
Correct grammar mistakes inline using [correction] format. Explain WHY each correction matters.
When the user asks about vocabulary, provide: definition, IPA, 3 example sentences, common collocations,
and note any Vietnamese false friends or tricky points. Keep responses concise and encouraging.
```

---

## Roadmap System

- 12 units: Units 1-4 (B1→B2), Units 5-8 (B2→C1), Units 9-12 (C1→C2)
- Unit 1 unlocked by default; unlock next when `lesson_progress` shows ≥80% of current unit lessons complete
- Dashboard renders SVG path connecting unit node circles (Framer Motion for "path drawing" animation)
- Each unit node shows: title, lock icon (if locked), completion % ring

---

## Content Sources (all free, fetched at runtime)

| Source | Usage | How |
|---|---|---|
| Free Dictionary API (`api.dictionaryapi.dev/api/v2/entries/en/{word}`) | EN-EN IPA, audio, definitions | HTTP GET, cache in SQLite |
| MyMemory / LibreTranslate | EN→VN translation | HTTP GET, cache in SQLite |
| VOA Learning English (`learningenglish.voanews.com`) | Listening + reading articles | RSS feed → parse articles |
| BBC Learning English (`bbc.co.uk/learningenglish`) | Structured lessons + audio | HTTP scrape or RSS |
| The Guardian API (free tier) | Real newspaper articles (C1/C2) | API key-less RSS |
| NPR News (`npr.org/rss`) | Podcast transcripts + audio | RSS + audio URL |
| 6 Minute English (BBC) | Podcast with transcript | RSS |
| TED Talks (scrape `ted.com/talks`) | Advanced listening | HTTP + transcript |
| Oxford 5000 list | Vocabulary curriculum | Bundled CSV in `assets/wordlists/` |
| Academic Word List | Advanced vocab (C1/C2) | Bundled CSV |
| YouTube via yt-dlp (optional) | Shadowing audio | User pastes URL, yt-dlp extracts audio |

**Click-to-define & translate popup** triggered by `mouseup` on any text → `window.getSelection()` → show popover with tabs:
- **Pronounce**: play audio + IPA phonetic display
- **EN-EN**: English definition + examples (Free Dictionary API)
- **EN-VN**: Vietnamese translation (MyMemory API, cached)
- **Add to flashcard** button

---

## Writing Skill Module

A dedicated **Writing** page with:
- **Daily Writing Prompts**: AI generates topic (essay, email, opinion, IELTS Task 2 style) matched to unit level
- **Grammar Checker**: User writes → AI analyzes → inline corrections with explanations (color-coded: red=error, yellow=suggestion, green=good)
- **Common Vietnamese→English Error Counter**: persistent sidebar listing the top 10 grammar mistakes the user makes, with "avoid this" reminders (e.g., article usage, subject-verb agreement, verb tense)
- **Model Answer**: after user submits, AI shows a C1/C2 model answer for comparison
- **Writing History**: saved in SQLite, user can review past essays and see improvement

Writing exercises per unit:
- Sentence transformation (passive→active, direct→reported speech)
- Error correction drills (spot and fix 5 mistakes in a paragraph)
- Cloze tests (fill missing grammar words)
- Free writing (timed: 150 words in 10 minutes)

---

## Newspaper & Podcast Module

### Newspaper Feed (`/News` page)
- Aggregates articles from: The Guardian RSS, VOA News, BBC News
- Filter by difficulty level (AI tags each article B1/B2/C1/C2 based on vocabulary density)
- Reader view: clean article display with click-to-define on every word
- Highlight unknown words (cross-reference against user's flashcard deck)
- "Save to reading list" + "Add all highlighted words to flashcards" bulk action

### Podcast Feed (`/Podcasts` page)
- Sources: VOA Learning English, BBC 6 Minute English, NPR, TED Talks
- Episode list with: title, duration, level badge, transcript availability flag
- In-app podcast player: speed control (0.5x–2x), 10s rewind button
- Transcript panel (side-by-side or below player) — synced highlighting as audio plays
- Sentence-level repeat: click any transcript sentence → jumps to that timestamp + loops it
- "Shadow this sentence" button: opens shadowing mode for that single sentence

---

## Shadowing Mode Flow

1. Display sentence text + play native audio (from lesson transcript + audio file)
2. User clicks "Record" → `MediaRecorder` captures mic audio
3. WaveSurfer.js shows both waveforms (native vs user) side by side
4. Option A (offline): visual waveform comparison only + speed metrics
5. Option B (AI): send user audio transcript to AI provider for pronunciation/rhythm feedback
6. "Try again" button loops the exercise

---

## Exercises (per lesson, per unit)

Each unit includes multiple exercise types to maximize interaction:

| Exercise Type | Module | Description |
|---|---|---|
| Multiple choice comprehension | Listening/Reading | 5 questions after each article/audio |
| Fill-in-the-blank cloze | Reading/Writing | Remove key words, user fills them |
| Sentence reordering | Grammar | Drag words into correct order |
| Error detection drill | Writing | Find the 3 grammar mistakes in this text |
| Dictation | Listening | Audio plays, user types what they hear |
| Sentence transformation | Grammar | Rewrite keeping the same meaning |
| Word form exercise | Vocabulary | noun→verb→adjective→adverb chains |
| Collocation matching | Vocabulary | Match verb + noun pairs (make/do, etc.) |
| Speaking prompt | Speaking | AI gives topic, user records 60s response, AI evaluates |
| Debate/Opinion | Speaking | AI takes opposite position, user must respond |

Exercises are stored in the `exercises` table, linked to `lessons`. Each completed exercise contributes to `unit_progress`.

---

## Implementation Phases

### Phase 1 — Scaffold (Day 1)
- `npm create @quick-start/electron@latest EnglishApp -- --template react-ts`
- Add Tailwind, shadcn/ui, React Router, Zustand, drizzle-orm, better-sqlite3
- Set up electron-vite config, TypeScript strict mode
- Create IPC bridge in preload.ts (expose `window.electron.ai`, `window.electron.db`)
- Basic shell layout: sidebar nav (Dashboard, Flashcards, Shadowing, Listening, Reading, Speaking, Writing, News, Podcasts, AI Tutor, Settings)

### Phase 2 — Database & Schema (Day 1-2)
- Write Drizzle schema in `src/db/schema.ts`
- Migration runner on app startup
- Seed Oxford 5000 CSV into `words` table
- Create 12 units + sample lessons (3 per unit)

### Phase 3 — Flashcard Engine (Day 2-4)
- Implement FSRS-4.5 in `src/lib/srs/fsrs.ts`
- Flashcard review UI: card flip animation, IPA display, audio play button, rating buttons
- Daily session: fetch due cards, run FSRS on each rating, update DB
- Progress bar for session, "Well done!" screen at end

### Phase 4 — Dictionary Integration (Day 3-4)
- `useDictionary` hook: check SQLite cache → fetch Free Dictionary API → cache result
- `DictionaryPopup` component: Pronounce / EN-EN / EN-VN tabs, "Add to flashcards" button
- Register `mouseup` listener on `document` for click-to-define in any page
- MyMemory API integration for EN→VN translation (cached in SQLite)

### Phase 5 — Roadmap & Units (Day 4-5)
- Dashboard SVG roadmap component
- Unit unlock logic (trigger on lesson completion)
- Unit detail page: list of lessons with completion badges

### Phase 6 — Listening & Reading Module (Day 5-7)
- VOA + BBC RSS parser in `electron/handlers/content.ts`
- Audio player with Howler.js + speed control + 10s rewind
- Full exercise suite: MCQ, fill-in-blank, dictation, sentence reordering
- Transcript reveal with click-to-define + click-to-translate (EN-EN + EN-VN tabs)
- Transcript sync highlighting (word highlights as audio plays)

### Phase 6b — Newspaper & Podcast Module (Day 7-8)
- News feed aggregator (Guardian + VOA + BBC RSS)
- AI level-tagging of articles (B1/B2/C1/C2)
- Podcast player with transcript sync + sentence-loop feature
- "Shadow this sentence" quick-launch to shadowing mode

### Phase 7 — Shadowing Mode (Day 8-10)
- MediaRecorder setup in renderer
- WaveSurfer.js dual waveform display
- Session loop: play → record → compare → rate → next
- AI feedback call (optional, if provider configured)

### Phase 7b — Writing Module (Day 10-11)
- Writing prompt UI with timer
- AI grammar analysis → inline color-coded correction display
- Vietnamese→English common mistake tracker (persisted in SQLite)
- Grammar drills: error detection, sentence transformation, cloze
- Writing history browser

### Phase 8 — AI Tutor (Day 11-13)
- Chat interface (messages list + input)
- Provider toggle button in chat header
- System prompt with Vietnamese-speaker tutor persona
- Grammar correction display: inline `[correction]` highlighting
- Conversation persistence in SQLite

### Phase 9 — Settings & Polish (Day 13-15)
- Settings page: API key inputs, provider toggle, daily word limit, Ollama URL config
- Daily streak tracker + stats on dashboard
- Onboarding flow (first launch): set level, enter API key (optional)
- Dark/light mode toggle (Tailwind `dark:` classes)

---

## Navigation (Sidebar)

- Dashboard (roadmap + daily stats + streak)
- Flashcards (SRS review)
- Listening (lessons + exercises)
- Reading (articles + exercises)
- Shadowing (pronunciation practice)
- Speaking (AI conversation + opinion prompts)
- Writing (essays + grammar drills)
- News (newspaper feed)
- Podcasts (episode browser + player)
- AI Tutor (free chat)
- Settings (API keys, preferences)

---

## Verification Plan

1. `npm run dev` → app opens, all sidebar pages navigate correctly
2. Seed database → flashcard session shows cards with IPA + audio button
3. Click any word → popup shows Pronounce / EN-EN / EN-VN tabs
4. Complete a lesson → unit progress updates → next unit unlocks on roadmap
5. News feed → loads articles with level badges, click-to-translate works
6. Podcast player → transcript syncs with audio, sentence loop works
7. Writing page → submit essay → AI returns inline color-coded corrections
8. Grammar mistake counter increments on repeated errors
9. AI Tutor: send a grammar error → Claude corrects inline
10. Toggle to Ollama → same chat routes to local model
11. Shadowing: play sentence audio, record, see dual waveforms
12. Settings: enter/remove API key → AI features gracefully enable/disable

---

## Key npm Packages

```json
{
  "electron": "^31",
  "electron-vite": "^2",
  "react": "^18",
  "react-router-dom": "^6",
  "zustand": "^4",
  "better-sqlite3": "^9",
  "drizzle-orm": "^0.30",
  "@anthropic-ai/sdk": "^0.24",
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
