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

CREATE TABLE IF NOT EXISTS shadowing_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_type TEXT NOT NULL CHECK(episode_type IN ('podcast','youtube','imported_article')),
  episode_id TEXT NOT NULL,
  sentence_index INTEGER NOT NULL,
  sentence_text TEXT NOT NULL,
  sentence_translation TEXT,
  native_audio_url TEXT,
  user_audio_blob BLOB,
  match_score INTEGER,
  phoneme_feedback TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  passed INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'learn' CHECK(mode IN ('learn','free')),
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

CREATE TABLE IF NOT EXISTS learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('video','audio','article','lesson','shadowing')),
  item_id TEXT NOT NULL,
  item_title TEXT NOT NULL,
  source TEXT,
  cefr_level TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
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
(12, 'Near-Native Fluency',  'C2', 12, 'Full proficiency, idiomatic mastery',            12);
`

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
`

const SEED_ACHIEVEMENTS = `
INSERT OR IGNORE INTO achievements (id, key, title, description, icon) VALUES
  (1, 'first_card',      'First Flame',        'Complete first flashcard session',  'Fire'),
  (2, 'word_hoarder',    'Word Hoarder',       'Add 100 words to deck',            'Books'),
  (3, 'sharpshooter',    'Sharpshooter',       '7-day streak',                     'Target'),
  (4, 'mimic_master',    'Mimic Master',       'Score 90%+ in shadowing',          'Mouth'),
  (5, 'essay_writer',    'Essay Writer',       'Submit 5 writing prompts',         'Pen'),
  (6, 'b2_graduate',     'B2 Graduate',        'Complete units 1-4',               'Graduation Cap'),
  (7, 'c1_champion',     'C1 Champion',        'Complete units 5-8',               'Trophy'),
  (8, 'daily_warrior',   'Daily Warrior',      'Complete 7 daily challenges',      'Sword'),
  (9, 'tutor_fan',       'Tutor Fan',          'Send 50 messages to AI Tutor',     'Chat Bubble'),
  (10, 'speed_reader',   'Speed Reader',       'Complete 10 reading lessons',      'Lightning');
`

const SEED_LESSONS = `
INSERT OR IGNORE INTO lessons (id, unit_id, title, type, content_url, transcript, locked) VALUES
  (1, 1, 'Present Perfect Deep Dive',   'listening',  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'I have lived in Hanoi for five years. She has just finished her homework. They have never eaten Vietnamese pho before.', 0),
  (2, 1, 'Articles & Determiners',      'reading',    NULL, 'Articles are small words that come before nouns. They help us understand whether we are talking about something specific or something general. The definite article the refers to a specific noun that both the speaker and listener know about. For example, pass me the book means a specific book that both people can identify. The indefinite articles a and an refer to non-specific things. We use a before consonant sounds and an before vowel sounds. Consider the sentence I need a pen. It does not matter which pen, any pen will do. Determiners include articles, demonstratives like this and that, and possessives like my and your. Mastering articles is one of the most important steps in moving from intermediate to advanced English proficiency. Without proper article usage, even simple sentences can become confusing to the reader.', 0),
  (3, 1, 'Everyday Expressions',        'speaking',   NULL, NULL, 0),
  (4, 2, 'Morning Routines',            'listening',  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'Every morning I wake up at six. Then I brush my teeth and have a quick breakfast. My brother always takes a shower before breakfast.', 1),
  (5, 2, 'At the Restaurant',           'reading',    NULL, 'Sarah and Marco walked into the Italian restaurant on Main Street. The hostess greeted them and led them to a cozy table by the window. After studying the menu for several minutes, Sarah decided to order the grilled salmon, while Marco chose the pasta carbonara. The waiter came by and recommended the chef special, a seasonal risotto with wild mushrooms. Both couples seemed to enjoy their meals immensely. When it was time to order dessert, they decided to split a chocolate lava cake to share. The restaurant was busy that evening, but the service remained excellent throughout. The bill arrived promptly after they finished eating, and it included a standard service charge. Sarah noticed that the restaurant used fresh herbs from their own garden, which made the dishes particularly flavorful. They left a generous tip and promised to return next time they were in town.', 1),
  (6, 2, 'Describing Your Day',         'writing',    NULL, NULL, 1),
  (7, 3, 'Job Interviews',              'listening',  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'Can you tell me about your experience? I have worked in marketing for ten years. My greatest strength is problem solving.', 1),
  (8, 3, 'Office Vocabulary',           'reading',    NULL, 'The quarterly report showed that the company had exceeded its revenue targets by fifteen percent. This impressive result prompted the CEO to schedule an emergency board meeting to discuss the next phase of expansion. The finance department proposed that they allocate additional resources to the research and development division. HR announced that they would be hiring twenty new employees across three departments. The project manager emphasized that every team needed to meet their deadlines by the end of the week. During the staff meeting, the marketing director presented a comprehensive analysis of their social media engagement metrics. She noted that their latest campaign had reached over two million people in just thirty days. The operations team outlined plans to streamline their supply chain processes to reduce overhead costs. Management also decided to postpone the office renovation until the following quarter to prioritize employee bonuses. By the end of the meeting, every department had a clear set of action items to complete before the next review period.', 1),
  (9, 3, 'Professional Emails',         'writing',    NULL, NULL, 1),
  (10, 4, 'Social Media Debate',       'listening',  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'Social media has changed the way we communicate. Some people say it brings us closer, but others argue it makes us more isolated.', 1),
  (11, 4, 'Tech Glossary',             'reading',    NULL, 'Technology has introduced hundreds of new terms into everyday language. An API, or Application Programming Interface, allows different software systems to communicate with each other seamlessly. Artificial Intelligence refers to computer systems that can perform tasks typically requiring human intelligence, such as visual perception and decision making. Machine learning is a subset of AI where computers learn from data without being explicitly programmed for every scenario. Blockchain is a distributed database that maintains a growing list of records called blocks, making it nearly impossible to alter past information without detection. Cloud computing allows users to access data and programs over the internet instead of storing everything on their local hard drives. The internet of things describes the network of physical devices embedded with sensors and software that exchange data with other devices. Cybersecurity encompasses all the measures taken to protect computer systems from theft or damage to hardware, software, or electronic data. Hardware refers to the physical components of a computer, while software consists of the programs and operating information that make the computer function. Understanding these fundamental terms is essential for anyone navigating the modern digital landscape where technology continues to evolve at an unprecedented pace.', 1),
  (12, 4, 'Opinion Writing',           'writing',    NULL, NULL, 1);
`

const SEED_EXERCISES = `
INSERT OR IGNORE INTO exercises (id, lesson_id, question, options, answer, type) VALUES
  (1,  1,  'How long has the speaker lived in Hanoi?',  NULL,       '5 years',  'mcq'),
  (2,  1,  'What has she just finished?',              NULL,       'Homework', 'mcq'),
  (3,  1,  'Have they eaten Vietnamese pho before?',   NULL,       'No',       'mcq'),
  (4,  1,  'She has _____ finished her homework.',     'just/already/yet/even', 'just', 'fill'),
  (5,  2,  'The sun is ___ star.',                     NULL,       'a',        'mcq'),
  (6,  2,  'It is about 150 million km from ___.',     NULL,       'Earth',    'mcq'),
  (7,  2,  'Without ___ sun, life on Earth would not exist.', 'a/the/nothing', 'the', 'fill'),
  (8,  2,  'The sun gives us ___ and heat.',           NULL,       'light',    'fill'),
  (9,  4,  'What time does the speaker wake up?',      NULL,       'Six',      'mcq'),
  (10, 4,  'What does he have before breakfast?',      NULL,       'Nothing',  'mcq'),
  (11, 4,  'Who takes a shower before breakfast?',     NULL,       'Brother',  'mcq'),
  (12, 4,  'Every morning she/he ___ at six.',         'wakes up/wake up/woke up/waking', 'wakes up', 'fill'),
  (13, 7,  'How many years of experience does the speaker have?', NULL, '10 years', 'mcq'),
  (14, 7,  'What is the field of work?',               NULL,       'Marketing', 'mcq'),
  (15, 7,  'My greatest ___ is problem solving.',      NULL,       'strength', 'fill'),
  (16, 10, 'How has social media changed us?',         NULL,       'The way we communicate', 'mcq'),
  (17, 10, 'Some say it brings us ___.',               NULL,       'Closer',   'mcq'),
  (18, 10, 'Others argue it makes us more ___.',       NULL,       'Isolated', 'mcq'),
  (19, 5,  'What did the couple order for the main course?', NULL, 'Grilled salmon', 'mcq'),
  (20, 5,  'The waiter recommended the ___.',           NULL, 'chef special', 'fill'),
  (21, 5,  'They decided to ___ their dessert order.',  NULL, 'split', 'fill'),
  (22, 5,  'The bill included a ___ charge.',           NULL, 'service', 'mcq'),
  (23, 8,  'What is the deadline for the project?',     NULL, 'Friday', 'mcq'),
  (24, 8,  'The CEO wants to ___ the meeting.',         NULL, 'postpone', 'fill'),
  (25, 8,  'We need to ___ our resources more efficiently.', NULL, 'allocate', 'fill'),
  (26, 8,  'The ___ suggested a 15% increase in revenue.', NULL, 'quarterly report', 'mcq'),
  (27, 11, 'What does API stand for?',                  NULL, 'Application Programming Interface', 'mcq'),
  (28, 11, '___ is a system that mimics human intelligence.', NULL, 'Artificial Intelligence', 'fill'),
  (29, 11, 'Blockchain is a type of ___ database.',     NULL, 'distributed', 'fill'),
  (30, 11, 'The ___ is the physical part of a computer.', NULL, 'hardware', 'mcq');
`

const SEED_WORDS = `
INSERT OR IGNORE INTO words (id, word, ipa, audio_url, definition, pos, examples, level, unit_id, mnemonic, source_sentence) VALUES
  (1, 'abundant', '/abundant/', NULL, 'existing in large quantities; plentiful', 'adj', '["The region has abundant natural resources.", "There is abundant evidence to support this theory."]', 'B1', 1, NULL, 'Water is abundant in tropical regions.'),
  (2, 'accomplish', '/accomplish/', NULL, 'to achieve or complete successfully', 'verb', '["She accomplished her goal of running a marathon.", "The team accomplished what many thought impossible."]', 'B1', 1, NULL, 'Hard work will help you accomplish your dreams.'),
  (3, 'brilliant', '/brilliant/', NULL, 'exceptionally clever or talented; very bright', 'adj', '["She had a brilliant idea for the project.", "The performance was absolutely brilliant."]', 'B1', 1, NULL, 'A brilliant mind can solve difficult problems.'),
  (4, 'convenient', '/convenient/', NULL, 'suitable; easy to use or obtain', 'adj', '["Is Monday convenient for you?", "The hotel is in a convenient location near the airport."]', 'B1', 1, NULL, 'We need a time that is convenient for everyone.'),
  (5, 'distinguish', '/distinguish/', NULL, 'to recognize or treat differently', 'verb', '["It is hard to distinguish between the two versions.", "She can distinguish between fact and opinion."]', 'B1', 1, NULL, 'Experience helps you distinguish good advice from bad.'),
  (6, 'enthusiasm', '/enthusiasm/', NULL, 'intense enjoyment or excitement', 'noun', '["He greeted us with great enthusiasm.", "Her enthusiasm for learning is contagious."]', 'B1', 1, NULL, 'Show enthusiasm and people will want to work with you.'),
  (7, 'genuine', '/genuine/', NULL, 'real; authentic; sincere', 'adj', '["She showed genuine concern for others.", "Is this a genuine leather jacket?"]', 'B1', 1, NULL, 'A genuine friend stays by you during difficult times.'),
  (8, 'hesitate', '/hesitate/', NULL, 'to pause before doing something; to be uncertain', 'verb', '["Do not hesitate to ask for help.", "He hesitated before giving his answer."]', 'B1', 1, NULL, 'Never hesitate to speak up for what you believe.'),
  (9, 'inevitable', '/inevitable/', NULL, 'certain to happen; unavoidable', 'adj', '["Change is inevitable in life.", "The consequences were inevitable."]', 'B1', 1, NULL, 'With experience, some mistakes become inevitable lessons.'),
  (10, 'negotiate', '/negotiate/', NULL, 'to discuss something to reach an agreement', 'verb', '["They negotiated a new contract.", "She learned to negotiate salary increases."]', 'B1', 1, NULL, 'Good negotiators listen more than they speak.'),
  (11, 'commute', '/commute/', NULL, 'to travel regularly between home and work', 'verb', '["I commute to the city every day.", "Her daily commute takes forty minutes."]', 'B1', 2, NULL, 'A shorter commute means more time for family.'),
  (12, 'cozy', '/cozy/', NULL, 'giving a feeling of comfort and warmth', 'adj', '["They have a cozy little apartment.", "The cafe had a warm and cozy atmosphere."]', 'B1', 2, NULL, 'A cozy room makes you want to stay all day.'),
  (13, 'frustrating', '/frustrating/', NULL, 'causing feelings of annoyance or disappointment', 'adj', '["Dealing with bureaucracy can be frustrating.", "It is frustrating when technology fails."]', 'B1', 2, NULL, 'Do not let frustration stop you from trying again.'),
  (14, 'grateful', '/grateful/', NULL, 'feeling or showing thanks', 'adj', '["I am grateful for your help.", "She was grateful for the opportunity."]', 'B1', 2, NULL, 'Being grateful attracts more good things into your life.'),
  (15, 'meticulous', '/meticulous/', NULL, 'showing great attention to detail; very careful', 'adj', '["He is meticulous about keeping records.", "The artist was meticulous in her work."]', 'B1', 2, NULL, 'Meticulous planning prevents poor results.'),
  (16, 'collaborate', '/collaborate/', NULL, 'to work jointly with others', 'verb', '["The two companies collaborated on the project.", "Students often collaborate on group assignments."]', 'B2', 3, NULL, 'Great things happen when people collaborate effectively.'),
  (17, 'comprehensive', '/comprehensive/', NULL, 'including all necessary details; thorough', 'adj', '["The report provides a comprehensive overview.", "She gave a comprehensive explanation."]', 'B2', 3, NULL, 'A comprehensive understanding comes from studying many perspectives.'),
  (18, 'dominant', '/dominant/', NULL, 'most important, powerful, or influential', 'adj', '["English is the dominant language of business.", "The dominant opinion favored change."]', 'B2', 3, NULL, 'The dominant voice should not silence minority perspectives.'),
  (19, 'elaborate', '/elaborate/', NULL, 'to develop or explain in detail', 'verb', '["Could you elaborate on your point?", "She elaborated her plan over several meetings."]', 'B2', 3, NULL, 'An elaborate plan often needs simplification.'),
  (20, 'implement', '/implement/', NULL, 'to put a plan or system into effect', 'verb', '["The company will implement new policies next month.", "It took years to implement the changes."]', 'B2', 3, NULL, 'Ideas are worthless without proper implementation.'),
  (21, 'algorithm', '/algorithm/', NULL, 'a process or set of rules for calculations or problem solving', 'noun', '["The search algorithm ranks results by relevance.", "Social media algorithms control what content we see."]', 'B2', 4, NULL, 'An algorithm can process data faster than any human.'),
  (22, 'automate', '/automate/', NULL, 'to operate automatically using machines or software', 'verb', '["Many factories have automated their production lines.", "She wants to automate her email responses."]', 'B2', 4, NULL, 'Automation frees humans to focus on creative work.'),
  (23, 'disruptive', '/disruptive/', NULL, 'causing a radical change; disturbing the normal flow', 'adj', '["Social media was a disruptive technology.", "The startup introduced a disruptive business model."]', 'B2', 4, NULL, 'Disruptive innovations often face resistance before they succeed.'),
  (24, 'interface', '/interface/', NULL, 'a point where two systems interact; a user screen', 'noun', '["The user interface is intuitive and clean.", "The API interface connects the two applications."]', 'B2', 4, NULL, 'A good interface makes complex technology feel simple.'),
  (25, 'obsolete', '/obsolete/', NULL, 'no longer produced or used; out of date', 'adj', '["Typewriters became obsolete with computers.", "The technology is now obsolete."]', 'B2', 4, NULL, 'What is innovative today may be obsolete tomorrow.'),
  (26, 'ambiguous', '/ambiguous/', NULL, 'open to more than one interpretation; unclear', 'adj', '["The instructions were ambiguous.", "His response was deliberately ambiguous."]', 'B2', 5, NULL, 'Ambiguous language leads to ambiguous outcomes.'),
  (27, 'contemplate', '/contemplate/', NULL, 'to think about carefully; to consider', 'verb', '["She contemplated the meaning of life.", "He contemplated his career options."]', 'B2', 5, NULL, 'To contemplate is to pause and think deeply.'),
  (28, 'dilemma', '/dilemma/', NULL, 'a situation requiring a difficult choice between alternatives', 'noun', '["She faced a moral dilemma.", "The government is in a difficult dilemma."]', 'B2', 5, NULL, 'Every dilemma teaches something about your values.'),
  (29, 'nuance', '/nuance/', NULL, 'a subtle difference in meaning or expression', 'noun', '["The translation lost some of the nuance.", "She understands every nuance of the argument."]', 'B2', 5, NULL, 'A nuance can change the entire meaning of a sentence.'),
  (30, 'perspective', '/perspective/', NULL, 'a particular attitude toward or way of regarding something', 'noun', '["Travel gives you a new perspective on life.", "Try to see it from my perspective."]', 'B2', 5, NULL, 'Different perspectives make for stronger arguments.'),
  (31, 'empirical', '/empirical/', NULL, 'based on observation or experience rather than theory', 'adj', '["The theory is supported by empirical evidence.", "They conducted empirical research."]', 'C1', 6, NULL, 'Empirical data is the foundation of scientific inquiry.'),
  (32, 'paradigm', '/paradigm/', NULL, 'a typical example, pattern, or model; a framework', 'noun', '["The discovery shifted the scientific paradigm.", "A paradigm shift changed the industry."]', 'C1', 6, NULL, 'A paradigm shift requires bold thinking.'),
  (33, 'prevalent', '/prevalent/', NULL, 'widespread; commonly occurring', 'adj', '["The disease was prevalent in the region.", "Corruption remains prevalent in some areas."]', 'C1', 6, NULL, 'Prevalent myths often contain kernels of truth.'),
  (34, 'synthesize', '/synthesize/', NULL, 'to combine ideas to form a coherent whole', 'verb', '["She was able to synthesize complex data.", "The essay synthesizes multiple viewpoints."]', 'C1', 6, NULL, 'Synthesizing information is a key research skill.'),
  (35, 'unprecedented', '/unprecedented/', NULL, 'never done or known before', 'adj', '["The pandemic created unprecedented challenges.", "There has been unprecedented growth."]', 'C1', 6, NULL, 'Unprecedented times demand unprecedented solutions.'),
  (36, 'catalyst', '/catalyst/', NULL, 'something that causes activity or change', 'noun', '["The event was a catalyst for reform.", "Her speech served as a catalyst for change."]', 'C1', 7, NULL, 'A catalyst accelerates change without being consumed.'),
  (37, 'deteriorate', '/deteriorate/', NULL, 'to become progressively worse', 'verb', '["His health continued to deteriorate.", "The relationship deteriorated over time."]', 'C1', 7, NULL, 'Without attention, situations will deteriorate.'),
  (38, 'pragmatic', '/pragmatic/', NULL, 'dealing with things in a practical way', 'adj', '["She took a pragmatic approach to the problem.", "We need a pragmatic solution."]', 'C1', 7, NULL, 'A pragmatic approach values results over ideology.'),
  (39, 'scrutinize', '/scrutinize/', NULL, 'to examine very carefully and in detail', 'verb', '["The report was scrutinized by experts.", "Candidates are scrutinized by the media."]', 'C1', 7, NULL, 'To scrutinize is to look beyond the surface.'),
  (40, 'ubiquitous', '/ubiquitous/', NULL, 'present, appearing, or found everywhere', 'adj', '["Smartphones have become ubiquitous.", "Coffee shops are ubiquitous in the city."]', 'C1', 7, NULL, 'When something is ubiquitous, it becomes invisible.'),
  (41, 'bureaucracy', '/bureaucracy/', NULL, 'excessive complexity of rules; administrative system', 'noun', '["The bureaucracy slowed down the process.", "Reducing bureaucracy is a political promise."]', 'C1', 8, NULL, 'Bureaucracy often prioritizes procedure over results.'),
  (42, 'consequential', '/consequential/', NULL, 'following as a result; important or significant', 'adj', '["The election had consequential implications.", "It was a consequential decision."]', 'C1', 8, NULL, 'Consequential events reshape the future.'),
  (43, 'dichotomy', '/dichotomy/', NULL, 'a division between two contrasting things', 'noun', '["There is a dichotomy between theory and practice.", "The dichotomy between rich and poor is stark."]', 'C1', 8, NULL, 'A dichotomy simplifies what is often more complex.'),
  (44, 'resilience', '/resilience/', NULL, 'the capacity to recover quickly from difficulties', 'noun', '["The resilience of the economy was impressive.", "She showed remarkable resilience."]', 'C1', 8, NULL, 'Resilience is built through overcoming adversity.'),
  (45, 'sustainability', '/sustainability/', NULL, 'the ability to maintain processes without depleting resources', 'noun', '["Sustainability is a key concern for businesses.", "The project focuses on environmental sustainability."]', 'C1', 8, NULL, 'Sustainability requires balancing present needs with future generations.'),
  (46, 'ambivalence', '/ambivalence/', NULL, 'mixed feelings or contradictory ideas', 'noun', '["His ambivalence about the decision was evident.", "There is public ambivalence about the policy."]', 'C2', 10, NULL, 'Ambivalence reveals the complexity of human emotion.'),
  (47, 'juxtapose', '/juxtapose/', NULL, 'to place close together for contrasting effect', 'verb', '["The artist juxtaposed light and dark.", "She juxtaposed classical and modern elements."]', 'C2', 10, NULL, 'To juxtapose is to let contrasts speak for themselves.'),
  (48, 'profound', '/profound/', NULL, 'very great or intense; having deep insight', 'adj', '["The book had a profound impact on me.", "She made a profound observation."]', 'C2', 10, NULL, 'Profound thinking requires profound attention.'),
  (49, 'quintessential', '/quintessential/', NULL, 'representing the most perfect example of something', 'adj', '["He is the quintessential gentleman.", "This is the quintessential example of the genre."]', 'C2', 10, NULL, 'The quintessential example captures the essence perfectly.'),
  (50, 'verisimilitude', '/verisimilitude/', NULL, 'the appearance of being true or real', 'noun', '["The novel has a sense of verisimilitude.", "The film achieves remarkable verisimilitude."]', 'C2', 10, NULL, 'Verisimilitude makes fiction feel real.');
`

const SEED_FLASHCARDS = `
INSERT OR IGNORE INTO flashcards (id, word_id, due_date, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review) VALUES
  (1,  1,  date('now'), 2.5, 5.0, 1, 3, 1, 0, 'learning', date('now', '-1 day')),
  (2,  2,  date('now'), 3.0, 4.5, 2, 5, 2, 0, 'learning', date('now', '-1 day')),
  (3,  3,  date('now'), 4.0, 4.0, 3, 7, 3, 0, 'review', date('now', '-3 days')),
  (4,  4,  date('now'), 1.5, 6.0, 1, 2, 1, 0, 'learning', date('now', '-2 days')),
  (5,  5,  date('now'), 2.0, 5.5, 1, 3, 1, 0, 'learning', date('now', '-2 days')),
  (6,  6,  date('now'), 5.0, 3.5, 4, 10, 4, 0, 'review', date('now', '-5 days')),
  (7,  7,  date('now'), 3.5, 4.0, 2, 5, 2, 0, 'learning', date('now', '-2 days')),
  (8,  8,  date('now'), 2.0, 5.0, 1, 3, 1, 0, 'learning', date('now', '-1 day')),
  (9,  9,  date('now', '+1 day'), 6.0, 3.0, 5, 14, 5, 0, 'review', date('now', '-5 days')),
  (10, 10, date('now', '+1 day'), 4.0, 4.5, 3, 7, 3, 0, 'review', date('now', '-3 days')),
  (11, 11, date('now', '+1 day'), 3.0, 5.0, 2, 5, 2, 0, 'learning', date('now', '-2 days')),
  (12, 12, date('now', '+2 day'), 5.0, 3.5, 4, 10, 4, 0, 'review', date('now', '-5 days')),
  (13, 13, date('now', '+2 day'), 2.5, 5.5, 1, 3, 1, 0, 'learning', date('now', '-1 day')),
  (14, 14, date('now', '+3 day'), 6.0, 3.0, 5, 14, 5, 0, 'review', date('now', '-5 days')),
  (15, 15, date('now', '+3 day'), 4.0, 4.0, 3, 7, 3, 0, 'review', date('now', '-3 days')),
  (16, 16, date('now', '+4 day'), 3.0, 5.0, 2, 5, 2, 0, 'learning', date('now', '-2 days')),
  (17, 17, date('now', '+5 day'), 5.0, 3.5, 4, 10, 4, 0, 'review', date('now', '-5 days')),
  (18, 18, date('now', '+5 day'), 2.0, 6.0, 1, 2, 1, 0, 'learning', date('now', '-1 day')),
  (19, 19, date('now', '+6 day'), 4.0, 4.5, 3, 7, 3, 0, 'review', date('now', '-3 days')),
  (20, 20, date('now', '+7 day'), 6.0, 3.0, 5, 14, 5, 0, 'review', date('now', '-5 days')),
  (21, 21, date('now', '+7 day'), 3.5, 4.5, 2, 5, 2, 0, 'learning', date('now', '-2 days')),
  (22, 22, date('now', '+8 day'), 2.5, 5.0, 1, 3, 1, 0, 'learning', date('now', '-1 day')),
  (23, 23, date('now', '+8 day'), 5.0, 3.5, 4, 10, 4, 0, 'review', date('now', '-5 days')),
  (24, 24, date('now', '+9 day'), 4.0, 4.0, 3, 7, 3, 0, 'review', date('now', '-3 days')),
  (25, 25, date('now', '+10 day'), 6.0, 3.0, 5, 14, 5, 0, 'review', date('now', '-5 days')),
  (26, 26, date('now', '+10 day'), 3.0, 5.5, 2, 5, 2, 0, 'learning', date('now', '-2 days')),
  (27, 27, date('now', '+11 day'), 2.0, 5.0, 1, 3, 1, 0, 'learning', date('now', '-1 day')),
  (28, 28, date('now', '+11 day'), 5.0, 4.0, 4, 10, 4, 0, 'review', date('now', '-5 days')),
  (29, 29, date('now', '+12 day'), 4.0, 4.5, 3, 7, 3, 0, 'review', date('now', '-3 days')),
  (30, 30, date('now', '+12 day'), 6.0, 3.0, 5, 14, 5, 0, 'review', date('now', '-5 days'));
`

const SEED_YOUTUBE = `
INSERT OR IGNORE INTO youtube_episodes (video_id, title, channel, duration, thumbnail, published_at, level, saved_at) VALUES
  ('rS8e2MzE4gk', 'Grammar Game Show - Present Perfect', 'BBC Learning English', '25:00', NULL, datetime('now', '-30 days'), 'B1', datetime('now', '-30 days')),
  ('oBMeH3tqEEY', 'The Daily - Global News Analysis', 'BBC Learning English', '15:30', NULL, datetime('now', '-25 days'), 'B2', datetime('now', '-25 days')),
  ('1Cz4FgKz0Jk', 'Words That Change Meaning When Stress Changes', 'BBC Learning English', '8:45', NULL, datetime('now', '-20 days'), 'B1', datetime('now', '-20 days')),
  ('JiBmq8E7xGg', 'Trending: Social Media and Society', 'BBC Learning English', '12:20', NULL, datetime('now', '-15 days'), 'B2', datetime('now', '-15 days')),
  ('Yn0qBTdPCkI', 'At the Restaurant - Learning English Listening', 'BBC Learning English', '6:15', NULL, datetime('now', '-10 days'), 'A2', datetime('now', '-10 days')),
  ('3nQJFb4qJjE', 'Think You Know English Idioms?', 'BBC Learning English', '10:30', NULL, datetime('now', '-8 days'), 'B2', datetime('now', '-8 days')),
  ('dQv5EqD4Cjg', 'How to Sound More Natural in English', 'English with Lucy', '18:20', NULL, datetime('now', '-35 days'), 'B1', datetime('now', '-35 days')),
  ('jXmoH6BhPE0', 'Academic Writing Tips for IELTS', 'English with Lucy', '22:15', NULL, datetime('now', '-28 days'), 'C1', datetime('now', '-28 days')),
  ('F_3uRbqv0Gg', 'Fluent English Speaking Practice', 'mmmEnglish', '20:45', NULL, datetime('now', '-18 days'), 'B1', datetime('now', '-18 days')),
  ('X7uVt8JKwJE', 'English Pronunciation - Silent Letters', 'mmmEnglish', '14:30', NULL, datetime('now', '-12 days'), 'B1', datetime('now', '-12 days')),
  ('3sjJadpSRgE', 'Learn English With Us - Full Lesson', 'VOA Learning English', '30:00', NULL, datetime('now', '-40 days'), 'A2', datetime('now', '-40 days')),
  ('vXcufJvOrYc', 'Business English Vocabulary', 'VOA Learning English', '16:45', NULL, datetime('now', '-22 days'), 'B2', datetime('now', '-22 days')),
  ('4WpLzB7FzJI', 'The Future of AI - Can Computers Think?', 'TED', '14:20', NULL, datetime('now', '-32 days'), 'C1', datetime('now', '-32 days')),
  ('8sG4FmGJh3A', 'How to Learn Any Language Fast', 'TED-Ed', '5:30', NULL, datetime('now', '-15 days'), 'B2', datetime('now', '-15 days')),
  ('eO5m2b8ssS4', 'The Power of Not Knowing Anything', 'TED', '12:45', NULL, datetime('now', '-8 days'), 'C1', datetime('now', '-8 days')),
  ('h6O4ITySI_U', 'Why You Should Learn a Second Language', 'TED-Ed', '4:15', NULL, datetime('now', '-5 days'), 'B1', datetime('now', '-5 days')),
  ('qJ8c6J0RqJg', 'Mr Steve Teaches English - Common Mistakes', 'English Addict with Mr Steve', '11:30', NULL, datetime('now', '-20 days'), 'B1', datetime('now', '-20 days')),
  ('mL0Yga5F3qE', 'English Conversation Practice for Beginners', 'English Addict with Mr Steve', '25:00', NULL, datetime('now', '-10 days'), 'A2', datetime('now', '-10 days'));
`

const SEED_VOCAB_SET_WORDS = `
INSERT OR IGNORE INTO vocab_set_words (vocab_set_id, word_id) VALUES
  (1, 16), (1, 17), (1, 19), (1, 20),
  (2, 11), (2, 12), (2, 14), (2, 6),
  (3, 21), (3, 22), (3, 24), (3, 25), (3, 23),
  (4, 31), (4, 32), (4, 34), (4, 35),
  (5, 17), (5, 20), (5, 29),
  (6, 37), (6, 39),
  (7, 41), (7, 42), (7, 44), (7, 45), (7, 43),
  (8, 41), (8, 42), (8, 44), (8, 45),
  (9, 26), (9, 27), (9, 28), (9, 30),
  (10, 29), (10, 30), (10, 45),
  (11, 46), (11, 47), (11, 48), (11, 49), (11, 50),
  (12, 43), (12, 48), (12, 46);
`

const SEED_DAILY_CHALLENGES = `
INSERT OR IGNORE INTO daily_challenges (date, type, config, xp_reward) VALUES
  (date('now'), 'vocab_blitz', '{"limit": 20, "time_limit": 300}', 25),
  (date('now', '+1 day'), 'listening_dictation', '{"duration": 60}', 25),
  (date('now', '+2 day'), 'shadow_master', '{"sentences": 3, "target_score": 80}', 25),
  (date('now', '+3 day'), 'writing_sprint', '{"word_count": 150, "time_limit": 600}', 25),
  (date('now', '+4 day'), 'grammar_gauntlet', '{"questions": 10}', 25);
`

const SEED_PERSONAS = `
INSERT OR IGNORE INTO leaderboard_personas (id, name, avatar, total_xp, level, streak) VALUES
  (1, 'Alice', 'Alice', 340, 4, 5),
  (2, 'Bob', 'Bob', 520, 6, 8),
  (3, 'Carol', 'Carol', 780, 9, 12),
  (4, 'David', 'David', 150, 2, 2),
  (5, 'Eva', 'Eva', 950, 10, 15);
`

export function runMigrations(db: Database.Database): void {
  db.exec(SCHEMA)
  db.exec(SEED_UNITS)
  db.exec(SEED_VOCAB_SETS)
  db.exec(SEED_ACHIEVEMENTS)
  db.exec(SEED_LESSONS)
  db.exec(SEED_EXERCISES)
  db.exec(SEED_WORDS)
  db.exec(SEED_FLASHCARDS)
  db.exec(SEED_YOUTUBE)
  db.exec(SEED_DAILY_CHALLENGES)
  db.exec(SEED_PERSONAS)
  db.exec(SEED_VOCAB_SET_WORDS)

  try { db.exec(`ALTER TABLE units ADD COLUMN topic_category TEXT`) } catch {}
  try { db.exec(`ALTER TABLE daily_stats ADD COLUMN xp_earned INTEGER NOT NULL DEFAULT 0`) } catch {}
  try { db.exec(`ALTER TABLE saved_articles ADD COLUMN summary TEXT`) } catch {}
  try { db.exec(`ALTER TABLE words ADD COLUMN source_context TEXT`) } catch {}
  try { db.exec(`ALTER TABLE youtube_episodes ADD COLUMN transcript TEXT`) } catch {}

  db.exec(`
    INSERT OR IGNORE INTO unit_progress (unit_id, percent_complete)
    SELECT id, 0 FROM units WHERE unlocked = 1
  `)
}
