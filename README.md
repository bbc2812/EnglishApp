# WiseRain

A comprehensive offline-capable Electron desktop app for Vietnamese speakers targeting B1/B2 → C1/C2 English fluency. Combines structured CEFR-aligned curriculum, spaced repetition vocabulary (FSRS-4.5), pronunciation shadowing, listening/reading exercises, and an AI tutor — all in a single local desktop app.

Inspired by: **Memrise, ELSA, MediaDict, TedDict, eJoy, 4English, LingoLand, Blinkist**.

## Quick Start

```bash
npm install
npm run dev           # Electron app (hot reload)
npm run typecheck     # TypeScript check (runs separately)
npm run build         # Production build
```

## Features

| Module | Description |
|---|---|
| **Dashboard** | Roadmap path, daily stats, XP/level, achievements |
| **Flashcards** | FSRS-4.5 spaced repetition with mnemonics + context |
| **Listening** | CEFR-aligned lessons with transcript + comprehension |
| **Reading** | Articles with exercises, reading speed (WPM) tracking |
| **Shadowing** | Sentence-by-sentence practice (Learn/Free/Review), AI pronunciation scoring, C1/C2 word highlighting |
| **Speaking** | Debate/opinion/role-play with 60s timer |
| **Writing** | AI feedback with Vietnamese grammar explanations |
| **AI Tutor** | Claude / Gemini / Ollama — bilingual grammar corrections |
| **News** | NewsAPI.org + BBC Learning English + Guardian Open Platform |
| **Podcasts** | BBC podcasts, AI-generated transcripts with VN translations |
| **YouTube** | 6 curated channels, auto-subtitle fetching (en/vi) |
| **Import** | URL import with AI summary + B1/B2/C1 adaptation |
| **My Learning** | Mark/unmark items as learned, progress tracking |
| **Stats** | Analytics dashboard (line, pie, area, heatmap charts) |
| **Settings** | API keys, theme, shadowing config, notification preferences |

## Architecture

- **Electron 31** with **electron-vite 2** — 3 bundles (main, preload, renderer)
- **React 18 + TypeScript** for the renderer
- **Tailwind CSS + shadcn/ui** for styling
- **Zustand** for state management (persisted settings)
- **Better-sqlite3** for local SQLite database (21 tables)
- **HashRouter** with 15 routes
- **IPC via `window.api`** — 40 handlers across 5 modules
- **AI providers:** Claude (sonnet-4-6), Gemini (2.0-flash), Ollama (llama3.2)

## Documentation

| File | Purpose |
|---|---|
| `PLAN.md` | Feature spec, roadmap, implementation phases, verification checklist |
| `PROJECT_REFERENCE.md` | Full DB schema, IPC channels, code patterns, quick reference |
| `CLAUDE.md` | Concise architecture guide for AI agents |
| `AGENTS.md` | Development guide and conventions |

## Tech Stack

Electron 31 · electron-vite 2 · React 18 · TypeScript · Tailwind CSS 3 · Zustand · better-sqlite3 · FSRS-4.5 · Framer Motion · Howler.js · WaveSurfer.js · React Router v6
