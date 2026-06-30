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
  unit_id INTEGER REFERENCES units(id),
  mnemonic TEXT,
  source_sentence TEXT,
  source_url TEXT
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
  xp_earned INTEGER NOT NULL DEFAULT 0,
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
  summary TEXT,
  reading_mins REAL NOT NULL DEFAULT 0,
  comprehension_score INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE,
  title TEXT,
  description TEXT,
  icon TEXT,
  unlocked_at TEXT
);

CREATE TABLE IF NOT EXISTS user_xp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE,
  type TEXT NOT NULL,
  config TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 25
);

CREATE TABLE IF NOT EXISTS youtube_episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT UNIQUE,
  title TEXT NOT NULL,
  channel TEXT,
  duration TEXT,
  thumbnail TEXT,
  published_at TEXT,
  transcript TEXT,
  level TEXT NOT NULL DEFAULT 'B1',
  saved_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clipboard_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leaderboard_personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  avatar TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vocab_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  description TEXT,
  unit_id INTEGER REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS vocab_set_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocab_set_id INTEGER NOT NULL REFERENCES vocab_sets(id),
  word_id INTEGER NOT NULL REFERENCES words(id)
);

CREATE TABLE IF NOT EXISTS pronunciation_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  match_score INTEGER,
  phoneme_feedback TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
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
`;
const SEED_VOCAB_SETS = `
INSERT OR IGNORE INTO vocab_sets (id, title, topic, level, description, unit_id) VALUES
  (1,  'Business Meetings',       'business',  'B1', 'Essential vocabulary for meetings and discussions',  3),
  (2,  'Travel & Tourism',        'travel',    'B1', 'Words and phrases for travel experiences',            2),
  (3,  'Technology Terms',        'technology','B2', 'Digital world vocabulary and concepts',            4),
  (4,  'Academic Writing',        'academic',  'C1', 'Formal vocabulary for essays and papers',           6),
  (5,  'Health & Medicine',       'health',    'B2', 'Medical and wellness vocabulary',                   3),
  (6,  'Phrasal Verbs',           'idioms',    'B2', 'Common phrasal verbs and their meanings',           7),
  (7,  'IELTS Academic Word List','ielts',     'C1', 'High-frequency academic words for IELTS',          8),
  (8,  'News & Current Affairs',  'news',      'C1', 'Vocabulary from world news and politics',          8),
  (9,  'Negotiations',            'business',  'C1', 'Advanced business negotiation language',           5),
  (10, 'Environmental Issues',    'science',   'C1', 'Vocabulary for climate and environment topics',    5),
  (11, 'Literary Terms',          'literature','C2', 'Vocabulary for analyzing literature',            11),
  (12, 'Legal & Society',         'law',       'C1', 'Legal terms and social justice vocabulary',       10);
`;
const SEED_ACHIEVEMENTS = `
INSERT OR IGNORE INTO achievements (id, key, title, description, icon) VALUES
  (1, 'first_card',      '🔥 First Flame',        'Complete first flashcard session',  '🔥'),
  (2, 'word_hoarder',    '📚 Word Hoarder',       'Add 100 words to deck',            '📚'),
  (3, 'sharpshooter',    '🎯 Sharpshooter',       '7-day streak',                     '🎯'),
  (4, 'mimic_master',    '🗣️ Mimic Master',       'Score 90%+ in shadowing',          '🗣️'),
  (5, 'essay_writer',    '✍️ Essay Writer',       'Submit 5 writing prompts',         '✍️'),
  (6, 'b2_graduate',     '🎓 B2 Graduate',        'Complete units 1-4',               '🎓'),
  (7, 'c1_champion',     '🏆 C1 Champion',        'Complete units 5-8',               '🏆'),
  (8, 'daily_warrior',   '⚔️ Daily Warrior',      'Complete 7 daily challenges',      '⚔️'),
  (9, 'tutor_fan',       '💬 Tutor Fan',          'Send 50 messages to AI Tutor',     '💬'),
  (10, 'speed_reader',   '⚡ Speed Reader',       'Complete 10 reading lessons',      '⚡');
`;
const SEED_DAILY_CHALLENGES = `
INSERT OR IGNORE INTO daily_challenges (date, type, config, xp_reward) VALUES
  (date('now'), 'vocab_blitz', '{"limit": 20, "time_limit": 300}', 25),
  (date('now', '+1 day'), 'listening_dictation', '{"duration": 60}', 25),
  (date('now', '+2 day'), 'shadow_master', '{"sentences": 3, "target_score": 80}', 25),
  (date('now', '+3 day'), 'writing_sprint', '{"word_count": 150, "time_limit": 600}', 25),
  (date('now', '+4 day'), 'grammar_gauntlet', '{"questions": 10}', 25);
`;
const SEED_PERSONAS = `
INSERT OR IGNORE INTO leaderboard_personas (id, name, avatar, total_xp, level, streak) VALUES
  (1, 'Alice', '👩‍🎓', 340, 4, 5),
  (2, 'Bob', '👨‍💻', 520, 6, 8),
  (3, 'Carol', '👩‍🔬', 780, 9, 12),
  (4, 'David', '🧑‍🏫', 150, 2, 2),
  (5, 'Eva', '👩‍🎨', 950, 10, 15);
`;
const SEED_LESSONS = `
INSERT OR IGNORE INTO lessons (id, unit_id, title, type, content_url, transcript, locked) VALUES
  -- Unit 1
  (1, 1, 'Present Perfect Deep Dive',   'listening',  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'I have lived in Hanoi for five years. She has just finished her homework. They have never eaten Vietnamese pho before.', 0),
  (2, 1, 'Articles & Determiners',      'reading',    NULL, NULL, 0),
  (3, 1, 'Everyday Expressions',        'speaking',   NULL, NULL, 0),
  -- Unit 2
  (4, 2, 'Morning Routines',            'listening',  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'Every morning I wake up at six. Then I brush my teeth and have a quick breakfast. My brother always takes a shower before breakfast.', 1),
  (5, 2, 'At the Restaurant',           'reading',    NULL, NULL, 1),
  (6, 2, 'Describing Your Day',         'writing',    NULL, NULL, 1),
  -- Unit 3
  (7, 3, 'Job Interviews',              'listening',  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'Can you tell me about your experience? I have worked in marketing for ten years. My greatest strength is problem solving.', 1),
  (8, 3, 'Office Vocabulary',           'reading',    NULL, NULL, 1),
  (9, 3, 'Professional Emails',         'writing',    NULL, NULL, 1),
  -- Unit 4
  (10, 4, 'Social Media Debate',       'listening',  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'Social media has changed the way we communicate. Some people say it brings us closer, but others argue it makes us more isolated.', 1),
  (11, 4, 'Tech Glossary',             'reading',    NULL, NULL, 1),
  (12, 4, 'Opinion Writing',           'writing',    NULL, NULL, 1);
`;
const SEED_EXERCISES = `
INSERT OR IGNORE INTO exercises (id, lesson_id, question, options, answer, type) VALUES
  -- Lesson 1: Present Perfect (listening)
  (1,  1,  'How long has the speaker lived in Hanoi?',  NULL,       '5 years',  'mcq'),
  (2,  1,  'What has she just finished?',              NULL,       'Homework', 'mcq'),
  (3,  1,  'Have they eaten Vietnamese pho before?',   NULL,       'No',       'mcq'),
  (4,  1,  'She has _____ finished her homework.',     'just/already/yet/even', 'just', 'fill'),
  -- Lesson 2: Articles (reading)
  (5,  2,  'The sun is ___ star.',                     NULL,       'a',        'mcq'),
  (6,  2,  'It is about 150 million km from ___.',     NULL,       'Earth',    'mcq'),
  (7,  2,  'Without ___ sun, life on Earth would not exist.', 'a/the/nothing', 'the', 'fill'),
  (8,  2,  'The sun gives us ___ and heat.',           NULL,       'light',    'fill'),
  -- Lesson 4: Morning Routines (listening)
  (9,  4,  'What time does the speaker wake up?',      NULL,       'Six',      'mcq'),
  (10, 4,  'What does he have before breakfast?',      NULL,       'Nothing',  'mcq'),
  (11, 4,  'Who takes a shower before breakfast?',     NULL,       'Brother',  'mcq'),
  (12, 4,  'Every morning she/he ___ at six.',         'wakes up/wake up/woke up/waking', 'wakes up', 'fill'),
  -- Lesson 7: Job Interviews (listening)
  (13, 7,  'How many years of experience does the speaker have?', NULL, '10 years', 'mcq'),
  (14, 7,  'What is the field of work?',               NULL,       'Marketing', 'mcq'),
  (15, 7,  'My greatest ___ is problem solving.',      NULL,       'strength', 'fill'),
  -- Lesson 10: Social Media (listening)
  (16, 10, 'How has social media changed us?',         NULL,       'The way we communicate', 'mcq'),
  (17, 10, 'Some say it brings us ___.',               NULL,       'Closer',   'mcq'),
  (18, 10, 'Others argue it makes us more ___.',       NULL,       'Isolated', 'mcq');
`;
export function runMigrations(db) {
    db.exec(SCHEMA);
    db.exec(SEED_UNITS);
    db.exec(SEED_VOCAB_SETS);
    db.exec(SEED_ACHIEVEMENTS);
    db.exec(SEED_LESSONS);
    db.exec(SEED_EXERCISES);
    db.exec(SEED_DAILY_CHALLENGES);
    db.exec(SEED_PERSONAS);
    // Add missing columns for existing databases (idempotent)
    try {
        db.exec(`ALTER TABLE units ADD COLUMN topic_category TEXT`);
    }
    catch { }
    try {
        db.exec(`ALTER TABLE daily_stats ADD COLUMN xp_earned INTEGER NOT NULL DEFAULT 0`);
    }
    catch { }
    try {
        db.exec(`ALTER TABLE saved_articles ADD COLUMN summary TEXT`);
    }
    catch { }
    try {
        db.exec(`ALTER TABLE words ADD COLUMN source_context TEXT`);
    }
    catch { }
    db.exec(`
    INSERT OR IGNORE INTO unit_progress (unit_id, percent_complete)
    SELECT id, 0 FROM units WHERE unlocked = 1
  `);
}
