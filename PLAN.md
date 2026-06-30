# Plan: WiseRain — Local English Learning Desktop App

## Context
Build a comprehensive offline-capable Electron desktop app for a Vietnamese-speaking user at B1/B2 level targeting C1/C2 fluency in 3 months. The app combines structured CEFR-aligned curriculum, spaced repetition vocabulary, pronunciation shadowing, listening/reading exercises, and an AI tutor — all in a single local desktop app with no mandatory internet requirement (AI features are optional online).

Inspired by best features from: **Memrise, ELSA, MediaDict, TedDict, eJoy, 4English, LingoLand, Blinkist**.

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

## Build Status

| Phase | Status | Commit |
|---|---|---|
| Phase 1+2 — Scaffold + DB schema | ✅ Done | bc3ea1b |
| Phase 3 — Flashcard engine (FSRS-4.5) | ✅ Done | fe8af27 |
| Phase 4 — Dictionary popup (EN-EN + EN-VN) | ✅ Done | fe8af27 |
| Phase 5 — Roadmap + unit unlock + Topical Vocab | ✅ Done | — |
| Phase 6 — Listening & Reading module | ✅ Done | — |
| Phase 6b — Newspaper, Podcast & Blinkist Summaries | ✅ Done | — |
| Phase 7 — Shadowing + Pronunciation scoring (ELSA-style) | ✅ Done | — |
| Phase 7b — Writing module + Vietnamese grammar explanations | ✅ Done | — |
| Phase 8 — AI Tutor (Claude / Gemini / Ollama) + Speaking | ✅ Done | — |
| Phase 9 — Settings, XP/Achievements, Daily Challenge, Polish | ✅ Done | — |
| Phase 9.1 — Onboarding, Toast Notifications, Streak Bonus | ✅ Done | — |
| Phase 9.2 — Wide-Range Auto-Feed Resources | ✅ Done | — |

---

## Database Schema (SQLite via better-sqlite3)

```sql
-- Curriculum
units          (id, title, cefr_level, unit_order, description, unlocked, topic_category)
lessons        (id, unit_id, title, type, content_url, transcript, locked)
exercises      (id, lesson_id, question, options JSON, answer, type)

-- Vocabulary & SRS
words          (id, word, ipa, audio_url, definition, pos, examples JSON, level, unit_id,
                source_url, source_sentence, mnemonic)
                -- source_url/sentence: eJoy-style "word seen in context"
                -- mnemonic: Memrise-style memory story
flashcards     (id, word_id, due_date, stability, difficulty, elapsed_days, scheduled_days,
                reps, lapses, state, last_review)

-- Topical vocabulary sets (4English-style)
vocab_sets     (id, title, topic, level, description)
vocab_set_words (id, vocab_set_id, word_id)

-- Progress
lesson_progress  (id, lesson_id, completed_at, score)
unit_progress    (id, unit_id, percent_complete, unlocked_at)
daily_stats      (date TEXT PK, words_reviewed, new_words, listening_mins, speaking_mins,
                  writing_mins, xp_earned, streak)
grammar_mistakes (id, type, description, count, last_seen)

-- Pronunciation (ELSA-style)
pronunciation_sessions (id, word, native_audio_url, user_audio_blob, match_score,
                        phoneme_feedback JSON, created_at)

-- Gamification (LingoLand-style)
user_xp        (id, total_xp, level, updated_at)
achievements   (id, key TEXT UNIQUE, title, description, icon, unlocked_at)
daily_challenges (date TEXT PK, type, config JSON, completed INTEGER DEFAULT 0, xp_reward)

-- Content (cached from internet)
saved_articles  (id, url, title, source, level, content, summary, saved_at)
                -- summary: Blinkist-style key-idea extraction
saved_podcasts  (id, url, title, source, duration, transcript JSON, saved_at)

-- AI
conversations   (id, type, provider, messages JSON, created_at)
writing_history (id, prompt, content, ai_feedback JSON, score, created_at)

-- Cache
dictionary_cache  (word TEXT PK, data JSON, fetched_at)
translation_cache (word TEXT PK, translation TEXT, fetched_at)
```

All tables created via `electron/db/migrate.ts` (idempotent `CREATE TABLE IF NOT EXISTS`). 12 CEFR units seeded with `INSERT OR IGNORE`.

---

## FSRS-4.5 Algorithm

Implemented in `src/lib/srs/fsrs.ts`:
- `schedule(card, rating)` → returns updated card with new `due_date`, `stability`, `difficulty`
- Ratings: `Again=1`, `Hard=2`, `Good=3`, `Easy=4`
- Uses published FSRS-4.5 w0–w18 default parameters
- Daily queue: `SELECT * FROM flashcards WHERE due_date <= today ORDER BY due_date LIMIT ?`

---

## AI Provider Abstraction

Three providers routed through `electron/handlers/ai.ts` via IPC:

| Provider | Package | Key source | Cost |
|---|---|---|---|
| Claude | `@anthropic-ai/sdk` | console.anthropic.com | Paid per token |
| Gemini | `@google/generative-ai` | aistudio.google.com | **Free tier available** |
| Ollama | HTTP fetch | localhost:11434 | Free (local) |

> **Note:** Claude Pro (claude.ai subscription) ≠ API access. API keys are separate from console.anthropic.com.

**AI Tutor system prompt** (Vietnamese-specific):
```
You are an expert English tutor for a Vietnamese speaker at B1/B2 level aiming for C1/C2.
Correct grammar mistakes inline using [correction] format. Explain WHY it matters.
For vocabulary: give definition, IPA, 3 examples, collocations, Vietnamese false friends.
For grammar rules: explain in BOTH English and Vietnamese (song ngữ).
Highlight common Vietnamese→English traps: missing articles, wrong tense, SVO word order errors.
Be concise, specific, and encouraging.
```

---

## Roadmap System

- 12 units: 1-4 (B1→B2), 5-8 (B2→C1), 9-12 (C1→C2)
- Unit 1 unlocked by default; unlock next when `lesson_progress` shows ≥80% of current unit lessons done
- Dashboard renders SVG curved path connecting 12 unit node circles (Framer Motion path-draw animation)
- Each node: title, CEFR badge, lock icon (if locked), completion % ring

---

## Features Inspired by Best-in-Class Apps

### 1. Phoneme Pronunciation Scoring — ELSA-style
**Phase 7 (Shadowing)**
- After user records, AI analyzes which specific phonemes are wrong (e.g. "/θ/ sounds like /d/")
- Word-level score 0–100% displayed after each attempt
- Colour-coded: green (good), orange (needs work), red (incorrect)
- Phoneme feedback stored in `pronunciation_sessions` table for progress tracking
- "Problem sounds" panel: lists your top 5 most-missed phonemes across all sessions
- Special drills for Vietnamese-speaker weak spots: /θ/ /ð/ /r/ /l/ /v/ /w/ final consonants

### 2. Dual Subtitles — eJoy-style
**Phase 6b (Podcast player)**
- Podcast/video transcript shown with **English line + Vietnamese translation line** simultaneously
- Toggle: EN only / EN+VN / VN only
- Vietnamese line fetched via MyMemory API per sentence, cached in SQLite
- Click any word in either subtitle line → DictionaryPopup opens

### 3. Word Seen in Original Context — eJoy/TedDict-style
**Phase 3 enhancement (Flashcards)**
- When a word is added to flashcards via the Dictionary popup, the source sentence and URL are saved (`words.source_sentence`, `words.source_url`)
- Flashcard back side shows: "You first saw this in: [source sentence]" with the word highlighted
- "Play original context" button: jumps to the podcast/article timestamp where the word appeared
- Helps brain remember words through episodic memory (where/when you encountered it)

### 4. Visual Mnemonics — Memrise-style
**Phase 3 enhancement (Flashcards)**
- Each flashcard has a "Mnemonic" field (stored in `words.mnemonic`)
- User can write their own memory story/trick per word (e.g. "BIZARRE — bi = two, zarre sounds like 'star', imagine two bizarre stars")
- AI can auto-generate a mnemonic on request: "Generate a memory trick for this word"
- Mnemonic shown on card back as a collapsible "💡 Memory Trick" section

### 5. Pronunciation Match % — 4English/ELSA-style
**Phase 7 (Shadowing)**
- After recording, Web Audio API compares energy envelope + timing of user vs native audio
- Displays a **match score %** (e.g. "78% match") as a simple visual meter
- For AI-enabled mode: sends user transcript to AI, AI returns rhythm/stress/intonation feedback
- Score history tracked in `pronunciation_sessions` for motivation

### 6. XP + Achievements — LingoLand-style
**Phase 9 (Polish)**
- Every activity earns XP: flashcard review (2 XP/card), lesson complete (20 XP), writing submitted (15 XP), shadowing session (10 XP), daily challenge (25 XP)
- Level thresholds: Level 1 = 0 XP, Level 2 = 100 XP, etc. (stored in `user_xp`)
- **Achievements** (stored in `achievements` table, unlocked once):
  - 🔥 "First Flame" — complete first flashcard session
  - 📚 "Word Hoarder" — add 100 words to deck
  - 🎯 "Sharpshooter" — 7-day streak
  - 🗣️ "Mimic Master" — score 90%+ in shadowing
  - ✍️ "Essay Writer" — submit 10 writing prompts
  - 🎓 "B2 Graduate" — complete units 1-4
  - 🏆 "C1 Champion" — complete units 5-8
- Achievement toast notification when unlocked (Framer Motion slide-in)
- XP bar visible in sidebar under username

### 7. Book/Article Summaries — Blinkist-style
**Phase 6b (Reading / News)**
- For long articles/content, AI generates a **"Quick Read" summary**: 5-8 key ideas, one per card
- Summary view: swipe/click through key ideas (like Blinkist's blink format)
- Each key idea is 2-3 sentences, C1/C2 vocabulary used
- "Expand" button → full article
- Highlight + save quotes to personal notebook (stored in `saved_articles.summary`)
- Sources: Guardian long reads, BBC features, TED talk transcripts
- Daily 15-min reading goal tracked in `daily_stats`

### 8. Topical Vocabulary Sets — 4English-style
**Phase 5 enhancement (Units/Vocab)**
- Pre-built vocabulary sets by topic stored in `vocab_sets` + `vocab_set_words`:
  - Business English (meetings, negotiations, emails)
  - Travel & Tourism
  - Academic & Research
  - Technology & Innovation
  - Health & Medicine
  - Law & Society
  - IELTS Academic Word List
  - News & Current Affairs idioms
- Accessible from sidebar or unit pages as supplementary decks
- Works same as regular flashcards (FSRS scheduling)
- `units.topic_category` field tags each unit with a topic

### 9. Vietnamese Grammar Explanations — 4English-style
**Phase 7b (Writing) + Phase 8 (AI Tutor)**
- Every grammar correction in Writing module includes a Vietnamese explanation panel
- Example: "❌ 'I go to school yesterday' → ✅ 'I went to school yesterday'" + "💬 Trong tiếng Việt, động từ không thay đổi theo thì (thời gian). Nhưng tiếng Anh bắt buộc phải dùng quá khứ đơn (went) khi nói về hành động đã hoàn thành."
- Pre-built list of **Top 20 Vietnamese→English errors** shown in Writing sidebar:
  1. Missing articles (a/an/the)
  2. Verb tense errors
  3. Subject-verb agreement
  4. Word order (adjective placement)
  5. Preposition confusion (in/on/at)
  6. Missing progressive aspect
  7. Overuse of "very" instead of strong adjectives
  8. Literal translation of Vietnamese idioms
  9. Double negatives
  10. Missing plural -s
  - ... (20 total, each with Vietnamese explanation)
- AI Tutor responds in bilingual mode when grammar is asked: English explanation + Vietnamese summary
- Toggle in Settings: "Grammar explanations in Vietnamese" (on by default)

### 10. Daily Challenge — LingoLand-style
**Phase 9 (Polish)**
- One special challenge per day, generated fresh each morning and stored in `daily_challenges`
- Challenge types rotate:
  - Vocabulary blitz: 20 cards in under 5 minutes
  - Listening dictation: transcribe a 60-second audio clip
  - Shadow master: nail a 3-sentence shadowing with ≥80% score
  - Writing sprint: 150-word essay in 10 minutes
  - Grammar gauntlet: 10 error-detection questions
- Bonus XP reward (25 XP) for completing the daily challenge
- Challenge status shown prominently on Dashboard with countdown timer
- Streak bonus: completing daily challenge 7 days in a row = +100 XP achievement

---

## Content Sources (all free)

| Source | Usage | Method |
|---|---|---|
| Free Dictionary API (`api.dictionaryapi.dev`) | EN-EN IPA, audio, definitions | HTTP GET, SQLite cache |
| MyMemory API | EN→VN translation + dual subtitles | HTTP GET, SQLite cache |
| VOA Learning English | Listening + reading articles | RSS feed |
| BBC Learning English | Structured lessons + audio | RSS / HTTP |
| The Guardian | Real newspaper articles (C1/C2) | RSS |
| NPR News | Podcast transcripts + audio | RSS |
| BBC 6 Minute English | Podcast with transcript | RSS |
| TED Talks | Advanced listening + summaries | HTTP + transcript |
| Oxford 5000 list | Vocabulary curriculum | Bundled CSV |
| Academic Word List | Advanced vocab (C1/C2) | Bundled CSV |
| Topical vocab sets | Business/travel/IELTS/academic | Bundled JSON |

---

## Exercises (10 types)

| Type | Module | Inspired by |
|---|---|---|
| Multiple choice comprehension | Listening/Reading | Standard |
| Fill-in-the-blank cloze | Reading/Writing | Standard |
| Sentence reordering (drag) | Grammar | Standard |
| Error detection drill | Writing | 4English |
| Dictation | Listening | Memrise |
| Sentence transformation | Grammar | Standard |
| Word form chains (noun/verb/adj/adv) | Vocabulary | Standard |
| Collocation matching | Vocabulary | Standard |
| Speaking prompt (60s record + AI eval) | Speaking | ELSA |
| Debate/Opinion (AI takes opposite side) | Speaking | Standard |

---

## Verification Checklist

1. `npm run dev` → app opens, all 11 sidebar pages load ✅
2. Flashcard back shows mnemonic + "first seen in" source sentence ✅
3. Generate mnemonic button → AI returns memory story, saved to DB ✅
4. Click any word → popup shows Pronounce / EN-EN / EN-VN tabs ✅
5. Podcast player → dual subtitles toggle works (EN / EN+VN / VN) ✅
6. Podcast subtitles → clickable words trigger dictionary lookup ✅
7. Long article → "Quick Read" summary shows 5-8 key ideas ✅
8. Complete a lesson → unit unlocks on roadmap ✅
9. Shadowing → pronunciation match % shown, phoneme feedback panel displayed ✅
10. Writing page → corrections include Vietnamese explanation + top mistakes panel ✅
11. AI Tutor → Claude, Gemini, Ollama all respond; grammar replies are bilingual ✅
12. Speaking module → debate/opinion/role-play prompts with 60s timer ✅
13. Complete any activity → XP earned, sidebar XP bar updates ✅
14. Unlock an achievement → toast notification appears ✅
15. Daily challenge card on Dashboard, completes correctly, +25 XP ✅
16. Settings → API keys save, bilingual toggle persists across sessions ✅
17. Onboarding → first-launch modal sets level, AI provider, daily goal ✅
18. Streak bonus → 7-day daily challenge streak = +100 XP ✅
19. Quick Read → News page Blinkist-style summaries ✅
20. XP aggregated from flashcards, listening, reading, writing, daily stats ✅
21. YouTube channel browser with in-app player (6 channels) ✅
22. URL Import → fetch + AI summary + 3-level adaptation + reading analytics ✅
23. Stats page → full analytics dashboard with recharts (line, pie, area, heatmap) ✅
24. NewsAPI.org integration (all categories: general, tech, science, business, sports) ✅
25. BBC Learning English API feed ✅
26. Guardian Open Platform feed ✅
27. Datamuse + Wiktionary + Cambridge dictionary enrichment ✅
28. Word of the Day + Quotes pages ✅
29. Global hotkey (Ctrl+Shift+D) clipboard capture ✅
30. System tray integration ✅
31. AI article adaptation (News in Levels style: B1/B2/C1) ✅
32. Reading speed tracker (WPM) ✅
33. AI Roleplay mode in AITutor ✅

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
