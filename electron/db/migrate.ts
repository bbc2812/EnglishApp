import type Database from 'better-sqlite3'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  unit_order INTEGER NOT NULL,
  description TEXT,
  unlocked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL REFERENCES units(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('listening','reading','speaking','writing')),
  content_url TEXT,
  transcript TEXT,
  locked INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  question TEXT NOT NULL,
  options TEXT,
  answer TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('mcq','fill','reorder','dictation','transform','error_detect','free'))
);

CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  ipa TEXT,
  audio_url TEXT,
  definition TEXT,
  pos TEXT,
  examples TEXT,
  level TEXT,
  unit_id INTEGER REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS flashcards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id) UNIQUE,
  due_date TEXT NOT NULL DEFAULT (date('now')),
  stability REAL NOT NULL DEFAULT 1.0,
  difficulty REAL NOT NULL DEFAULT 5.0,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'new' CHECK(state IN ('new','learning','review','relearning')),
  last_review TEXT
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  score INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS unit_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL REFERENCES units(id) UNIQUE,
  percent_complete REAL NOT NULL DEFAULT 0,
  unlocked_at TEXT
);

CREATE TABLE IF NOT EXISTS daily_stats (
  date TEXT PRIMARY KEY,
  words_reviewed INTEGER NOT NULL DEFAULT 0,
  new_words INTEGER NOT NULL DEFAULT 0,
  listening_mins INTEGER NOT NULL DEFAULT 0,
  speaking_mins INTEGER NOT NULL DEFAULT 0,
  writing_mins INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS grammar_mistakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  last_seen TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source TEXT,
  level TEXT,
  content TEXT,
  saved_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_podcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source TEXT,
  duration INTEGER,
  transcript TEXT,
  saved_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('tutor','pronunciation','speaking','writing')),
  provider TEXT NOT NULL DEFAULT 'claude',
  messages TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS writing_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_feedback TEXT,
  score INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dictionary_cache (
  word TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS translation_cache (
  word TEXT PRIMARY KEY,
  translation TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`

const SEED_UNITS = `
INSERT OR IGNORE INTO units (id, title, cefr_level, unit_order, description, unlocked) VALUES
(1,  'Foundations',          'B1', 1,  'Core grammar and everyday vocabulary',          1),
(2,  'Daily Life',           'B1', 2,  'Practical conversations and routines',           0),
(3,  'Work & Society',       'B2', 3,  'Professional language and social topics',        0),
(4,  'Media & Technology',   'B2', 4,  'Digital world, news, media literacy',            0),
(5,  'Abstract Thinking',    'B2', 5,  'Expressing opinions, hypotheticals, nuance',     0),
(6,  'Academic English',     'C1', 6,  'Academic writing, formal register',              0),
(7,  'Idioms & Collocations','C1', 7,  'Natural sounding English, phrasal verbs',        0),
(8,  'Current Affairs',      'C1', 8,  'Deep news analysis, opinion pieces',             0),
(9,  'Advanced Grammar',     'C1', 9,  'Complex structures, inversion, subjunctives',    0),
(10, 'Critical Discourse',   'C2', 10, 'Rhetoric, persuasion, critical analysis',        0),
(11, 'Literary English',     'C2', 11, 'Literature, culture, artistic expression',       0),
(12, 'Near-Native Fluency',  'C2', 12, 'Full proficiency, idiomatic mastery',            0);
`

export function runMigrations(db: Database.Database): void {
  db.exec(SCHEMA)
  db.exec(SEED_UNITS)
}
