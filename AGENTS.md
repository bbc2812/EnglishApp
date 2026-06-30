# AGENTS.md — WiseRain Development Guide

> **Full reference:** `PROJECT_REFERENCE.md` — use for detailed schema, IPC patterns, and pending phases.

## Investigate First

1. **Config & scripts**: `package.json` scripts, `electron.vite.config.ts`, `tailwind.config.ts`, `tsconfig.*.json`
2. **Architecture**: `CLAUDE.md`, `PLAN.md`, `electron/main.ts`, `electron/preload.ts`, `src/App.tsx`
3. **DB**: `electron/db/migrate.ts` — raw SQL schema, **NOT `src/db/`**
4. **IPC**: `electron/preload.ts` exposes `window.api` — renderer uses `window.api.db`, `window.api.ai`, `window.api.content`
5. **State**: `src/store/` — `settingsStore` (persisted), `progressStore`, `sessionStore`

## Commands

```bash
npm run dev           # Electron app (hot reload)
npm run build         # Production build
npm run start         # Preview production build
npm run typecheck     # Type check (runs node + web)
npm run lint          # ESLint
npm run format        # Prettier
npm run build:win     # Build + NSIS installer
```

**Typecheck runs `tsc -p tsconfig.node.json` then `tsc -p tsconfig.web.json` separately — do not combine.**

## Architecture

**Three-bundle Electron (electron-vite):**

| Bundle | Source | Output |
|---|---|---|
| Main | `electron/main.ts` | `out/main/index.js` |
| Preload | `electron/preload.ts` | `out/preload/index.js` |
| Renderer | `index.html` + `src/` | `out/renderer/` (Vite SPA) |

**Process split:** `electron/` = Node.js (OS access). `src/` = React (browser sandbox). **Always use IPC via `window.api`** — never `import` Node/Electron in `src/`.

**IPC channel naming:** `ipcMain.handle('db:query', ...)` ↔ `ipcRenderer.invoke('db:query', ...)`. The preload wraps as `window.api.db.query/run/all`, `window.api.ai.chat/isAvailable`, `window.api.content.fetchRss/fetchDictionary/fetchTranslation`.

**DB:** `better-sqlite3` with **raw SQL queries** — `drizzle-orm` is in `package.json` but **unused**. Schema in `electron/db/migrate.ts`. DB file at `%APPDATA%/wiserain/data/wiserain.db` (Windows).

**AI providers:** `electron/handlers/ai.ts` — only Claude (`@anthropic-ai/sdk`) and Ollama (HTTP) are **implemented**. Gemini is in PLAN.md but not coded.

## Key Conventions

- **Tailwind components:** `.card`, `.btn-primary`, `.btn-secondary`, `.sidebar-link.active`, badge variants `.badge-b1`/`.badge-b2`/`.badge-c1`/`.badge-c2`
- **Vite alias:** `@renderer/*` → `src/*`
- **Dark mode default:** `bg-gray-950` body, brand palette `brand-400` = `#38bdf8`
- **Fonts:** Inter (sans), JetBrains Mono (mono)
- **Flashcard ratings:** `1=Again`, `2=Hard`, `3=Good`, `4=Easy` (FSRS-4.5)
- **Unit unlock:** `≥80%` of lessons in a unit → next unit unlocks automatically
- **Zustand stores:** `settingsStore` is persisted to localStorage (`wiserain-settings`)
- **Dictionary caching:** `dictionary_cache` + `translation_cache` tables, checked before API calls
- **Router:** `HashRouter`, 11 routes in `src/App.tsx`

## Adding Features

| Task | Files to Edit |
|---|---|
| New DB table | `electron/db/migrate.ts`, `src/env.d.ts` (if IPC) |
| New IPC channel | `electron/handlers/*.ts`, `electron/main.ts`, `electron/preload.ts`, `src/env.d.ts` |
| New page | `src/pages/Name.tsx`, `src/App.tsx`, `src/components/Layout/Sidebar.tsx` |
| New Zustand store | `src/store/nameStore.ts` |
| New hook | `src/hooks/nameHook.ts` |

## Gotchas

- **Never import Node/Electron in `src/`** — always IPC via `window.api`
- `npm install` on some systems needs `node node_modules/electron/install.js` to download binary
- `postcss.config.js` is ESM — may produce "Reparsing as ES module" warning (harmless)
- SQLite `.db` files are gitignored — never commit user data
- `window.api` types are in `src/env.d.ts` — add to this file when adding new IPC channels
- ESLint config: uses `@electron-toolkit/eslint-config-ts` — no local `.eslintrc.cjs`
- DB migration is idempotent: `CREATE TABLE IF NOT EXISTS` + `INSERT OR IGNORE`
- DB opened with WAL mode + foreign keys enabled
- `settingsStore` uses `persist()` middleware — changes survive restarts
