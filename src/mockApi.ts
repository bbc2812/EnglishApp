// Development mock: provides realistic sample data when running in browser (Vite dev mode)
// In production Electron, the real window.api is injected by preload.ts

const mockData = {
  lessons: {
    1: { id: 1, unit_id: 1, title: 'Present Perfect Deep Dive', type: 'listening', content_url: '', transcript: 'The present perfect tense connects the past to the present. We use it to talk about experiences that have relevance now. For example, I have lived here for ten years means I still live here now. This tense is formed with have or has plus the past participle of the main verb.', locked: 0 },
    2: { id: 2, unit_id: 1, title: 'Articles & Determiners', type: 'reading', content_url: '', transcript: 'Articles are one of the most commonly used words in English. The definite article "the" is used for specific nouns, while "a" and "an" are indefinite articles used for non-specific nouns. "A" is used before consonant sounds, and "an" before vowel sounds. Understanding articles is essential for clear communication.', locked: 0 },
    3: { id: 3, unit_id: 2, title: 'Everyday Expressions', type: 'listening', content_url: '', transcript: 'Native speakers use countless everyday expressions that can be confusing for learners. Phrasal verbs like give up, look forward to, and turn down are particularly tricky. The key is to practice them in context rather than memorizing lists.', locked: 0 },
    4: { id: 4, unit_id: 2, title: 'Morning Routines', type: 'listening', content_url: '', transcript: 'A good morning routine sets the tone for the entire day. Many successful people wake up early, exercise, and plan their priorities before starting work. Research shows that a consistent morning routine can improve productivity by up to 25 percent.', locked: 1 },
  },
  exercises: {
    1: [
      { id: 1, lesson_id: 1, question: 'Which sentence uses the present perfect correctly?', options: 'I have visited Paris/I visited Paris/I have visit Paris/I visits Paris', answer: 'I have visited Paris', type: 'mcq' },
      { id: 2, lesson_id: 1, question: 'She ___ here for five years.', options: 'has lived/lived/have lived/living', answer: 'has lived', type: 'mcq' },
      { id: 3, lesson_id: 1, question: 'I ___ never ___ to Japan.', options: 'have/been/have/went', answer: 'have been', type: 'fill' },
      { id: 4, lesson_id: 1, question: 'They ___ already ___ the project.', options: 'have/finished/have/finish/had/finish', answer: 'have finished', type: 'fill' },
      { id: 5, lesson_id: 1, question: 'Which tense connects past actions to the present?', options: 'present perfect/simple past/past perfect/future perfect', answer: 'present perfect', type: 'mcq' },
    ],
    2: [
      { id: 1, lesson_id: 2, question: '___ apple a day keeps the doctor away.', options: 'A/An/The/The a', answer: 'An', type: 'mcq' },
      { id: 2, lesson_id: 2, question: 'She is ___ honest person.', options: 'a/an/the/no article', answer: 'an', type: 'mcq' },
      { id: 3, lesson_id: 2, question: 'I need to buy ___ new laptop.', options: 'a/an/the/no article', answer: 'a', type: 'mcq' },
      { id: 4, lesson_id: 2, question: '___ rich should help ___ poor.', options: 'The/the/All/all', answer: 'The the', type: 'fill' },
    ],
    3: [
      { id: 1, lesson_id: 3, question: '"Give up" means:', options: 'to surrender/to give something away/to start something/to ignore', answer: 'to surrender', type: 'mcq' },
      { id: 2, lesson_id: 3, question: '"Look forward to" means:', options: 'to fear/to anticipate with pleasure/to look ahead/to avoid', answer: 'to anticipate with pleasure', type: 'mcq' },
      { id: 3, lesson_id: 3, question: 'I can\'t put ___ this meeting any longer.', options: 'off/on/up/out', answer: 'off', type: 'mcq' },
      { id: 4, lesson_id: 3, question: 'She turned ___ the job offer because the salary was too low.', options: 'down/up/out/off', answer: 'down', type: 'mcq' },
    ],
  },
  flashcardWords: [
    { id: 1, unit_id: 1, word: 'abundant', ipa: '/əˈbʌn.dənt/', definition: 'existing in large quantities; plentiful', examples: '["The region has abundant natural resources.", "There is abundant evidence to support this theory."]', source_sentence: 'Water is abundant in tropical regions.', mnemonic: '', audio_url: '', source_url: '' },
    { id: 2, unit_id: 1, word: 'compelling', ipa: '/kəmˈpel.ɪŋ/', definition: 'evoking interest, attention, or admiration in a powerful way', examples: '["She made a compelling argument for reform.", "The evidence was compelling enough to change his mind."]', source_sentence: 'The documentary presented compelling evidence.', mnemonic: '', audio_url: '', source_url: '' },
    { id: 3, unit_id: 1, word: 'diligent', ipa: '/ˈdɪl.ɪ.dʒənt/', definition: 'having or showing care and effort in one\'s work or duties', examples: '["She is a diligent student who always completes her homework.", "The diligent researcher spent years on the project."]', source_sentence: 'A diligent approach leads to success.', mnemonic: '', audio_url: '', source_url: '' },
    { id: 4, unit_id: 2, word: 'eloquent', ipa: '/ˈel.ə.kwənt/', definition: 'fluent or persuasive in speaking or writing', examples: '["He gave an eloquent speech at the conference.", "Her eloquent writing moved the audience to tears."]', source_sentence: 'The eloquent speaker captivated the room.', mnemonic: '', audio_url: '', source_url: '' },
    { id: 5, unit_id: 2, word: 'fluctuate', ipa: '/ˈflʌk.tʃu.eɪt/', definition: 'to rise and fall irregularly in number or amount', examples: '["Prices fluctuate depending on demand.", "Mood can fluctuate throughout the day."]', source_sentence: 'Temperatures fluctuate wildly in spring.', mnemonic: '', audio_url: '', source_url: '' },
    { id: 6, unit_id: 3, word: 'hierarchy', ipa: '/ˈhaɪə.rɑː.ki/', definition: 'a system where members are ranked according to relative status', examples: '["The company has a strict hierarchy.", "Social hierarchies exist in many animal species."]', source_sentence: 'The corporate hierarchy was clear to everyone.', mnemonic: '', audio_url: '', source_url: '' },
    { id: 7, unit_id: 3, word: 'inevitable', ipa: '/ɪˈnev.ɪ.tə.bəl/', definition: 'certain to happen; unavoidable', examples: '["Change is inevitable in any growing organization.", "It was inevitable that they would eventually disagree."]', source_sentence: 'The consequences of his actions were inevitable.', mnemonic: '', audio_url: '', source_url: '' },
    { id: 8, unit_id: 1, word: 'meticulous', ipa: '/məˈtɪk.jə.ləs/', definition: 'showing great attention to detail; very careful and precise', examples: '["She is meticulous in her research work.", "The artist was meticulous about every brushstroke."]', source_sentence: 'A meticulous approach ensures quality results.', mnemonic: '', audio_url: '', source_url: '' },
  ],
}

const flashcardRecords = mockData.flashcardWords.map(w => ({
  id: w.id, word_id: w.id, word: w.word, ipa: w.ipa,
  audio_url: w.audio_url, definition: w.definition,
  examples: w.examples, mnemonic: w.mnemonic,
  source_sentence: w.source_sentence, source_url: w.source_url,
  due_date: '2025-01-01', stability: 2.5, difficulty: 0.5,
  elapsed_days: 3, scheduled_days: 7, reps: 5, lapses: 0,
  state: 'review'
}))

const mockApi = {
  db: {
    _unlockedAchievements: new Set(['first_card', 'word_hoarder', 'sharpshooter', 'essay_writer', 'speed_reader']),
    _savedArticles: [] as any[],

    run: async (sql: string, params?: unknown[]) => {
      if (sql.includes('INSERT INTO achievements') && params) {
        mockApi.db._unlockedAchievements.add(params[0] as string)
      }
      if (sql.includes('INSERT INTO saved_articles') && params) {
        mockApi.db._savedArticles.push({ url: params[0], title: params[1], source: 'News' })
      }
      if (sql.includes('INSERT INTO pronunciation_sessions')) {
        return { changes: 1, lastInsertRowid: Date.now() }
      }
      return { changes: 1, lastInsertRowid: 1 }
    },
    query: async (sql: string, params?: unknown[]) => {
      if (sql.includes('achievements') && sql.includes('SELECT key')) {
        return Array.from(mockApi.db._unlockedAchievements).map(key => ({ key }))
      }
      // Dictionary cache
      if (sql.includes('SELECT data FROM dictionary_cache')) {
        // Return empty result to indicate no cache found
        return []
      }
      if (sql.includes('SELECT COUNT(*) as c FROM words')) return [{ c: 247 }]
      if (sql.includes('SELECT COUNT(*) as c FROM flashcards')) return [{ c: 89 }]
      if (sql.includes('SELECT COUNT(*) as c FROM writing_history')) return [{ c: 12 }]
      if (sql.includes('SELECT COUNT(*) as c FROM conversations')) return [{ c: 67 }]
      if (sql.includes('SELECT COUNT(*) as c FROM lesson_progress')) return [{ c: 15 }]
      if (sql.includes('SELECT COUNT(*) as c FROM units WHERE unlocked')) return [{ c: 3 }]
      if (sql.includes('SELECT streak FROM daily_stats')) return [{ streak: 7 }]
      if (sql.includes('SELECT MAX(match_score) as best')) return [{ best: 92 }]
      if (sql.includes('SELECT COUNT(*) as count FROM')) {
        if (sql.includes('achievements')) return [{ count: 5 }]
        if (sql.includes('lesson_progress')) return [{ count: 8 }]
        return [{ count: 0 }]
      }
      if (sql.includes('SELECT SUM(score')) return [{ total_xp: 480 }]
      if (sql.includes('SELECT SUM(xp_earned)')) return [{ total: 2340 }]
      if (sql.includes('SELECT MAX(streak)')) return [{ s: 12 }]
      if (sql.includes('SELECT key, unlocked_at')) return Array.from(mockApi.db._unlockedAchievements).map(k => ({ key: k, unlocked_at: daysAgo(30 - Math.floor(Math.random() * 30)) }))
      if (sql.includes('SELECT * FROM daily_stats ORDER BY date DESC LIMIT 30')) {
        return Array.from({ length: 7 }, (_, i) => ({
          date: daysAgo(i), words_reviewed: Math.floor(Math.random() * 30) + 10,
          new_words: Math.floor(Math.random() * 10) + 2,
          listening_mins: Math.floor(Math.random() * 20) + 5,
          speaking_mins: Math.floor(Math.random() * 15) + 2,
          writing_mins: Math.floor(Math.random() * 10) + 1,
          xp_earned: Math.floor(Math.random() * 50) + 20, streak: Math.floor(Math.random() * 7) + 1
        }))
      }
      if (sql.includes('SELECT * FROM daily_stats WHERE date')) return [{
        date: today(), words_reviewed: 15, new_words: 5, listening_mins: 12,
        speaking_mins: 8, writing_mins: 5, xp_earned: 45, streak: 3
      }]
      if (sql.includes('SELECT id, title, topic, level FROM vocab_sets')) return [
        { id: 1, title: 'Business Meetings', topic: 'business', level: 'B1' },
        { id: 2, title: 'Travel & Tourism', topic: 'travel', level: 'B1' },
        { id: 3, title: 'Technology Terms', topic: 'technology', level: 'B2' },
        { id: 4, title: 'Academic Writing', topic: 'academic', level: 'C1' }
      ]
      if (sql.includes('SELECT type, completed, xp_reward FROM daily_challenges')) return [
        { type: 'vocab_blitz', completed: 0, xp_reward: 25 }
      ]
      if (sql.includes('SELECT * FROM conversations ORDER BY')) return [
        { id: 1, type: 'tutor', provider: 'claude', messages: '[]', created_at: daysAgo(5) },
        { id: 2, type: 'tutor', provider: 'claude', messages: '[]', created_at: daysAgo(3) }
      ]
      if (sql.includes('SELECT * FROM grammar_mistakes ORDER BY')) return [
        { id: 1, type: 'Missing Articles', description: 'I go to school → I go to the school', count: 12, last_seen: daysAgo(1) },
        { id: 2, type: 'Verb Tense', description: 'I go yesterday → I went yesterday', count: 8, last_seen: daysAgo(2) },
        { id: 3, type: 'Subject-Verb Agreement', description: 'He play → He plays', count: 6, last_seen: daysAgo(3) }
      ]
      if (sql.includes('SELECT * FROM writing_history ORDER BY')) return [
        { id: 1, content: 'My daily routine is simple. I wake up at 7 AM, exercise for 30 minutes, then have breakfast before going to work. In the evening, I usually read for an hour before bed. This routine helps me stay focused and productive throughout the day.', score: 78, created_at: daysAgo(2) },
        { id: 2, content: 'Technology is changing the way we learn English. Online platforms provide instant feedback, and AI tutors can personalize lessons for each student. While traditional classrooms have their place, digital tools make language learning more accessible and engaging than ever before.', score: 85, created_at: daysAgo(5) },
        { id: 3, content: 'Traveling abroad is one of the best ways to improve your English skills. Immersion forces you to use the language in real situations, from ordering food to asking for directions. The mistakes you make along the way become valuable learning experiences.', score: 72, created_at: daysAgo(10) },
        { id: 4, content: 'The importance of reading in English cannot be overstated. Reading exposes you to new vocabulary, different writing styles, and complex ideas. Whether it is novels, news articles, or academic papers, regular reading practice builds both fluency and comprehension.', score: 80, created_at: daysAgo(15) }
      ]
      if (sql.includes('SELECT * FROM daily_stats ORDER BY date DESC LIMIT 7')) {
        return Array.from({ length: 7 }, (_, i) => ({
          name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || `Day ${i}`,
          value: Math.floor(Math.random() * 60) + 20
        }))
      }
      if (sql.includes('SELECT type, count FROM grammar_mistakes ORDER BY count DESC')) return [
        { type: 'Missing Articles', count: 12 }, { type: 'Verb Tense', count: 8 }
      ]
      if (sql.includes('SELECT COUNT(*) as c FROM units WHERE unlocked = 1')) return [{ c: 3 }]

      // Progress store: loadUnits
      if (sql.includes('SELECT u.id, u.title, u.cefr_level, u.unit_order, u.description') && sql.includes('percent_complete')) {
        return [
          { id: 1, title: 'Foundations', cefr_level: 'B1', unit_order: 1, description: 'Core grammar and essential vocabulary for everyday communication', unlocked: 1, percent_complete: 85 },
          { id: 2, title: 'Daily Life', cefr_level: 'B1', unit_order: 2, description: 'Practical conversations about daily routines, shopping, and social interactions', unlocked: 1, percent_complete: 60 },
          { id: 3, title: 'Work & Society', cefr_level: 'B2', unit_order: 3, description: 'Professional language for workplace communication and social issues', unlocked: 1, percent_complete: 20 },
          { id: 4, title: 'Media & Technology', cefr_level: 'B2', unit_order: 4, description: 'Understanding news, technology trends, and digital communication', unlocked: 0, percent_complete: 0 },
          { id: 5, title: 'Abstract Thinking', cefr_level: 'C1', unit_order: 5, description: 'Expressing abstract ideas, opinions, and nuanced arguments', unlocked: 0, percent_complete: 0 },
        ]
      }

      // Lesson list with unit info (Listening & Reading index pages)
      if (sql.includes('FROM lessons l JOIN units u')) {
        const type = sql.includes("'reading'") ? 'reading' : 'listening'
        return Object.values(mockData.lessons)
          .filter(l => l.type === type)
          .map(l => ({ ...l, unit_title: `Unit ${l.unit_id}`, cefr_level: l.unit_id <= 2 ? 'B1' : 'B2' }))
      }

      // Lesson data (Listening & Reading) - handles both params and string interpolation
      if (sql.includes('SELECT * FROM lessons')) {
        let lessonId: number
        if (params && params[0] !== undefined) {
          lessonId = parseInt(String(params[0]))
        } else {
          const match = sql.match(/WHERE\s+id\s*=\s*(\d+)/i)
          lessonId = match ? parseInt(match[1]) : 1
        }
        const lesson = mockData.lessons[lessonId]
        return lesson ? [lesson] : []
      }

      // Exercises for lessons - handles both params and string interpolation
      if (sql.includes('SELECT * FROM exercises')) {
        let lessonId: number
        if (params && params[0] !== undefined) {
          lessonId = parseInt(String(params[0]))
        } else {
          const match = sql.match(/WHERE\s+lesson_id\s*=\s*(\d+)/i)
          lessonId = match ? parseInt(match[1]) : 1
        }
        return mockData.exercises[lessonId] || []
      }

      // Unit progress
      if (sql.includes('INSERT INTO unit_progress') && sql.includes('SELECT')) return { changes: 1 }
      if (sql.includes('SELECT COUNT(*)') && sql.includes('completed')) return [{ c: 8 }]
      if (sql.includes('SELECT * FROM units WHERE')) {
        return [
          { id: 1, title: 'Foundations', cefr_level: 'B1', unlocked: 1, unit_order: 1 },
          { id: 2, title: 'Daily Life', cefr_level: 'B1', unlocked: 1, unit_order: 2 },
          { id: 3, title: 'Work & Society', cefr_level: 'B2', unlocked: 1, unit_order: 3 },
          { id: 4, title: 'Media & Technology', cefr_level: 'B2', unlocked: 0, unit_order: 4 },
          { id: 5, title: 'Abstract Thinking', cefr_level: 'C1', unlocked: 0, unit_order: 5 },
        ]
      }

      // Flashcard session data (words by unit)
      if (sql.includes('SELECT * FROM words') && sql.includes('unit_id')) {
        return mockData.flashcardWords
      }

      // Flashcard due cards (SRS) - matches the JOIN query in useSRS.loadDueCards
      if (sql.includes('flashcards') && sql.includes('due_date')) {
        return flashcardRecords
      }

      // Flashcard records by word_id
      if (sql.includes('flashcards') && sql.includes('word_id')) {
        const wordId = parseInt(String(params?.[0] ?? '0'))
        const records = flashcardRecords.filter(r => r.word_id === wordId)
        return records
      }

      // Words by unit_id
      if (sql.includes('words') && sql.includes('unit_id')) {
        return mockData.flashcardWords
      }

      // Lesson progress
      if (sql.includes('lesson_progress')) {
        return [
          { id: 1, lesson_id: 1, completed_at: daysAgo(5), score: 85 },
          { id: 2, lesson_id: 2, completed_at: daysAgo(3), score: 90 },
          { id: 3, lesson_id: 3, completed_at: daysAgo(1), score: 78 },
        ]
      }

      return []
    },
    all: async (sql: string, params?: unknown[]) => mockApi.db.query(sql, params)
  },

  content: {
    fetchNewsAPI: async (_category?: string) => [
      { title: 'AI Revolution in Healthcare: How Machine Learning Saves Lives', description: 'Artificial intelligence is transforming modern medicine, from diagnosing diseases earlier than ever to personalizing treatment plans based on individual patient data. Hospitals worldwide are adopting AI-powered systems.', url: 'https://example.com/health-ai', urlToImage: 'https://picsum.photos/seed/health/400/250', publishedAt: new Date().toISOString(), source: { name: 'TechHealth' } },
      { title: 'Global Climate Summit Reaches Historic Agreement on Carbon Emissions', description: 'World leaders have agreed to ambitious new targets for reducing carbon emissions by 2030, marking the most significant climate accord since the Paris Agreement of 2015.', url: 'https://example.com/climate', urlToImage: 'https://picsum.photos/seed/climate/400/250', publishedAt: new Date(Date.now() - 86400000).toISOString(), source: { name: 'Global Times' } },
      { title: 'Remote Work Trends: The Future of Office Culture in 2026', description: 'A comprehensive study reveals that 73% of knowledge workers prefer hybrid work arrangements, fundamentally reshaping how companies design their office spaces and manage teams.', url: 'https://example.com/remote', urlToImage: 'https://picsum.photos/seed/office/400/250', publishedAt: new Date(Date.now() - 172800000).toISOString(), source: { name: 'WorkForward' } },
      { title: 'New Study Links Regular Reading to Improved Mental Health', description: 'Researchers at Stanford University found that just 30 minutes of daily reading can reduce stress levels by up to 68%, outperforming other relaxation methods like listening to music or taking walks.', url: 'https://example.com/reading', urlToImage: 'https://picsum.photos/seed/read/400/250', publishedAt: new Date(Date.now() - 259200000).toISOString(), source: { name: 'Health Daily' } },
      { title: 'Electric Vehicle Sales Surpass Traditional Cars for First Time', description: 'In a landmark shift for the automotive industry, electric vehicle registrations have exceeded those of petrol and diesel cars in several European markets during the last quarter.', url: 'https://example.com/ev', urlToImage: 'https://picsum.photos/seed/car/400/250', publishedAt: new Date(Date.now() - 345600000).toISOString(), source: { name: 'Auto Weekly' } },
      { title: 'The Rise of Micro-Learning: Bite-Sized Education Goes Mainstream', description: 'Educational platforms reporting 300% growth in users who prefer five to ten minute learning sessions over traditional hour-long lectures, particularly among Gen Z learners.', url: 'https://example.com/micro', urlToImage: 'https://picsum.photos/seed/learn/400/250', publishedAt: new Date(Date.now() - 432000000).toISOString(), source: { name: 'EdTech Review' } },
      { title: 'Space Tourism Enters New Era with Commercial Space Station Plans', description: 'Multiple private companies have unveiled ambitious plans for commercial space stations, promising orbital experiences for civilian astronauts within the next five years.', url: 'https://example.com/space', urlToImage: 'https://picsum.photos/seed/space/400/250', publishedAt: new Date(Date.now() - 518400000).toISOString(), source: { name: 'Space News' } },
      { title: 'Language Learning Apps See Surge in Adult Learners Post-Pandemic', description: 'The global language learning market has grown to $12 billion, with adults between 25 and 45 representing the fastest-growing demographic seeking bilingual skills.', url: 'https://example.com/languages', urlToImage: 'https://picsum.photos/seed/lang/400/250', publishedAt: new Date(Date.now() - 604800000).toISOString(), source: { name: 'Language Today' } },
    ],
    fetchBBCLE: async (_filter?: string) => [
      { title: 'The Language News: AI and the Future of Translation', description: 'We explore how artificial intelligence is changing the way we translate between languages, and what this means for language learners around the world.', url: 'https://learningenglish.bbc.com/art/1', imageUrl: 'https://picsum.photos/seed/bbc1/400/250', publishedAt: new Date().toISOString(), type: 'article', level: 'B2', audioUrl: '', transcript: 'Welcome to The Language News. Today we look at how AI translation tools are evolving rapidly. While these tools are incredibly helpful for basic communication, experts emphasize that human language skills remain essential for nuanced understanding and cultural awareness.' },
      { title: '6 Minute English: Should We Learn Coding in School?', description: 'Should programming be a mandatory subject in schools? Our hosts discuss the pros and cons of coding education for young people.', url: 'https://learningenglish.bbc.com/art/2', imageUrl: 'https://picsum.photos/seed/bbc2/400/250', publishedAt: new Date(Date.now() - 86400000).toISOString(), type: 'audio', level: 'B1', audioUrl: '', transcript: 'Good morning and welcome to 6 Minute English. Today we\'re asking whether learning to code should be as essential as reading and writing in schools. My co-host thinks it absolutely should be.' },
      { title: 'English Idiom: Bite off more than you can chew', description: 'Learn about this popular idiom that describes taking on more than you can handle. We provide examples and practice exercises.', url: 'https://learningenglish.bbc.com/art/3', imageUrl: 'https://picsum.photos/seed/bbc3/400/250', publishedAt: new Date(Date.now() - 172800000).toISOString(), type: 'article', level: 'B1', audioUrl: '', transcript: 'This week\'s idiom is bite off more than you can chew. It means to accept a task that is too big or difficult for you to deal with successfully.' },
      { title: 'Pronunciation Tip: Mastering the TH Sound', description: 'Many English learners struggle with the th sound. Our pronunciation coach demonstrates the correct tongue position and provides practice words.', url: 'https://learningenglish.bbc.com/art/4', imageUrl: 'https://picsum.photos/seed/bbc4/400/250', publishedAt: new Date(Date.now() - 259200000).toISOString(), type: 'audio', level: 'A2', audioUrl: '', transcript: 'The th sound can be challenging because it does not exist in many languages. For the unvoiced th as in think, place your tongue between your teeth and blow air. For the voiced th as in this, use the same position but add vibration.' },
      { title: 'Word on the Street: What Young People Say About Learning English', description: 'We took to the streets to ask young people around the world why they are learning English and what challenges they face.', url: 'https://learningenglish.bbc.com/art/5', imageUrl: 'https://picsum.photos/seed/bbc5/400/250', publishedAt: new Date(Date.now() - 345600000).toISOString(), type: 'video', level: 'B1', audioUrl: '', transcript: 'Interview with young learners from Japan, Brazil, Germany, and Nigeria about their English learning journey and motivations.' },
      { title: 'Grammar Episode 12: Used to vs. Be Used to', description: 'These two similar-looking expressions have very different meanings. Learn how to use them correctly in your speaking and writing.', url: 'https://learningenglish.bbc.com/art/6', imageUrl: 'https://picsum.photos/seed/bbc6/400/250', publishedAt: new Date(Date.now() - 432000000).toISOString(), type: 'article', level: 'B2', audioUrl: '', transcript: 'Used to describes past habits that are no longer true. Be used to describes familiarity with something. I used to play tennis means I played in the past but do not now. I am used to the cold means the cold does not bother me.' },
      { title: 'Business English: Negotiation Vocabulary', description: 'Essential vocabulary and phrases for successful business negotiations, including expressions for making offers, counter-offers, and reaching agreement.', url: 'https://learningenglish.bbc.com/art/7', imageUrl: 'https://picsum.photos/seed/bbc7/400/250', publishedAt: new Date(Date.now() - 518400000).toISOString(), type: 'article', level: 'C1', audioUrl: '', transcript: 'In business negotiations, it is important to use precise language. Let us explore some key vocabulary including make an offer, counter offer, reach a compromise, and close the deal.' },
    ],
    fetchGuardianArticles: async () => [
      { id: '1', webTitle: 'Why language learning is the superpower of the 21st century', webUrl: 'https://theguardian.com/edu/1', sectionName: 'Education', webPublicationDate: new Date().toISOString(), pillarName: 'news' },
      { id: '2', webTitle: 'The neuroscience of how we acquire new vocabulary', webUrl: 'https://theguardian.com/science/2', sectionName: 'Science', webPublicationDate: new Date(Date.now() - 86400000).toISOString(), pillarName: 'news' },
      { id: '3', webTitle: 'How social media is changing the way we communicate', webUrl: 'https://theguardian.com/tech/3', sectionName: 'Technology', webPublicationDate: new Date(Date.now() - 172800000).toISOString(), pillarName: 'news' },
      { id: '4', webTitle: 'The art of persuasive writing in the digital age', webUrl: 'https://theguardian.com/culture/4', sectionName: 'Culture', webPublicationDate: new Date(Date.now() - 259200000).toISOString(), pillarName: 'news' },
      { id: '5', webTitle: 'Global migration patterns and the English language', webUrl: 'https://theguardian.com/world/5', sectionName: 'World', webPublicationDate: new Date(Date.now() - 345600000).toISOString(), pillarName: 'news' },
      { id: '6', webTitle: 'Why bilingualism makes you smarter and more creative', webUrl: 'https://theguardian.com/society/6', sectionName: 'Society', webPublicationDate: new Date(Date.now() - 432000000).toISOString(), pillarName: 'news' },
      { id: '7', webTitle: 'The evolution of English slang and internet language', webUrl: 'https://theguardian.com/tech/7', sectionName: 'Technology', webPublicationDate: new Date(Date.now() - 518400000).toISOString(), pillarName: 'news' },
      { id: '8', webTitle: 'Reading classical literature improves critical thinking skills', webUrl: 'https://theguardian.com/culture/8', sectionName: 'Culture', webPublicationDate: new Date(Date.now() - 604800000).toISOString(), pillarName: 'news' },
    ],
    fetchWordOfTheDay: async () => ({ word: 'Ubiquitous', url: 'https://www.merriam-webster.com/dictionary/ubiquitous' }),
    fetchQuotable: async () => [
      { content: 'The more that you read, the more things you will know. The more that you learn, the more places you will go.', author: 'Dr. Seuss' },
      { content: 'Language is the road map of a culture. It tells you where its people come from and where they are going.', author: 'Rita Mae Brown' },
      { content: 'To have another language is to possess a second soul.', author: 'Charlemagne' },
      { content: 'One language sets you in a corridor for life. Two languages open every doorway along the way.', author: 'Frank Smith' },
      { content: 'The limits of my language mean the limits of my world.', author: 'Ludwig Wittgenstein' },
      { content: 'Learning another language is not only learning different words for the same things, but learning another way to think about things.', author: 'Krystyna Flis' },
      { content: 'A different language is a different vision of life.', author: 'Federico Fellini' },
      { content: 'Language is the dress of thought.', author: 'Samuel Johnson' },
      { content: 'Speech is power: speech is to persuade, to convert, to compel.', author: 'Ralph Waldo Emerson' },
      { content: 'Language is the mirror of the mind.', author: 'A. Kirby Free' },
    ],
    fetchYouTubeRSS: async () => [
      { channel: 'BBC Learning English', episodes: [
        { videoId: 'JzDkDmMYjfg', title: '6 Minute English: Should we learn coding in school?', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 86400000).toISOString(), url: 'https://youtube.com/watch?v=JzDkDmMYjfg', learnt: false },
        { videoId: 'Mh3wXFjMk0I', title: 'The Language News: AI and translation technology', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 172800000).toISOString(), url: 'https://youtube.com/watch?v=Mh3wXFjMk0I', learnt: true },
        { videoId: 'wN3K7BhBzE0', title: 'English Idiom: Bite off more than you can chew', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 259200000).toISOString(), url: 'https://youtube.com/watch?v=wN3K7BhBzE0', learnt: true },
        { videoId: '8aR3pQqJd0c', title: 'Pronunciation: Mastering the TH sound', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 345600000).toISOString(), url: 'https://youtube.com/watch?v=8aR3pQqJd0c', learnt: false },
        { videoId: 'pVJLbQjZ0kE', title: 'Grammar Episode: Used to vs. Be used to', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 432000000).toISOString(), url: 'https://youtube.com/watch?v=pVJLbQjZ0kE', learnt: false },
        { videoId: 'xK7dGMFJpYQ', title: 'Business English: Negotiation vocabulary', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 518400000).toISOString(), url: 'https://youtube.com/watch?v=xK7dGMFJpYQ', learnt: false },
        { videoId: 'vL3rQ9fZ8kM', title: 'Top 10 English mistakes learners make', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 604800000).toISOString(), url: 'https://youtube.com/watch?v=vL3rQ9fZ8kM', learnt: true },
        { videoId: 'qR5tN8wX2pL', title: 'How to write a formal email in English', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 691200000).toISOString(), url: 'https://youtube.com/watch?v=qR5tN8wX2pL', learnt: false },
      ]},
      { channel: 'VOA Learning English', episodes: [
        { videoId: 'mT4kF8pL9vR', title: 'VOA: The Future of Artificial Intelligence', channel: 'VOA Learning English', publishedAt: new Date(Date.now() - 86400000).toISOString(), url: 'https://youtube.com/watch?v=mT4kF8pL9vR', learnt: false },
        { videoId: 'nB6wY3jK2xH', title: 'VOA: Climate Change and Agriculture', channel: 'VOA Learning English', publishedAt: new Date(Date.now() - 172800000).toISOString(), url: 'https://youtube.com/watch?v=nB6wY3jK2xH', learnt: true },
        { videoId: 'pC8dR5mN4wQ', title: 'VOA: American History Series - Civil Rights', channel: 'VOA Learning English', publishedAt: new Date(Date.now() - 259200000).toISOString(), url: 'https://youtube.com/watch?v=pC8dR5mN4wQ', learnt: false },
        { videoId: 'qD9eS6oP5yT', title: 'VOA: Technology Report on Social Media', channel: 'VOA Learning English', publishedAt: new Date(Date.now() - 345600000).toISOString(), url: 'https://youtube.com/watch?v=qD9eS6oP5yT', learnt: false },
        { videoId: 'rE0fT7qU6zV', title: 'VOA: Health and Wellness Tips', channel: 'VOA Learning English', publishedAt: new Date(Date.now() - 432000000).toISOString(), url: 'https://youtube.com/watch?v=rE0fT7qU6zV', learnt: true },
        { videoId: 'sF1gU8rW7aX', title: 'VOA: Education Innovation in Africa', channel: 'VOA Learning English', publishedAt: new Date(Date.now() - 518400000).toISOString(), url: 'https://youtube.com/watch?v=sF1gU8rW7aX', learnt: false },
      ]},
      { channel: 'TED', episodes: [
        { videoId: '8j7pL2qR4nM', title: 'The power of learning a new language', channel: 'TED', publishedAt: new Date(Date.now() - 86400000).toISOString(), url: 'https://youtube.com/watch?v=8j7pL2qR4nM', learnt: false },
        { videoId: '9k8mS3tU5oP', title: 'How to learn any language fast', channel: 'TED', publishedAt: new Date(Date.now() - 172800000).toISOString(), url: 'https://youtube.com/watch?v=9k8mS3tU5oP', learnt: true },
        { videoId: '1l9nT4vW6qR', title: 'The surprising habit of successful people', channel: 'TED', publishedAt: new Date(Date.now() - 259200000).toISOString(), url: 'https://youtube.com/watch?v=1l9nT4vW6qR', learnt: false },
        { videoId: '2m0oU5wX7sS', title: 'Why you should read classic literature', channel: 'TED', publishedAt: new Date(Date.now() - 345600000).toISOString(), url: 'https://youtube.com/watch?v=2m0oU5wX7sS', learnt: false },
      ]},
    ],
    fetchYouTubeChannel: async (_channelId?: string) => [
      { videoId: 'JzDkDmMYjfg', title: '6 Minute English: Should we learn coding in school?', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 86400000).toISOString(), url: 'https://youtube.com/watch?v=JzDkDmMYjfg', learnt: false, level: 'B1' },
      { videoId: '8aR3pQqJd0c', title: 'Pronunciation: Mastering the TH sound', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 345600000).toISOString(), url: 'https://youtube.com/watch?v=8aR3pQqJd0c', learnt: true, level: 'A2' },
      { videoId: 'pVJLbQjZ0kE', title: 'Grammar Episode: Used to vs. Be used to', channel: 'BBC Learning English', publishedAt: new Date(Date.now() - 432000000).toISOString(), url: 'https://youtube.com/watch?v=pVJLbQjZ0kE', learnt: false, level: 'B2' },
    ],
    fetchYouTubeSubtitles: async () => ({
      sentences: [
        { text: 'Welcome to today\'s episode of 6 Minute English.', translation: 'Chào mừng các bạn đến với tập phim 6 phút tiếng Anh hôm nay.', startTime: 0, endTime: 3.5 },
        { text: 'I am your host Robert and today we are discussing whether coding should be taught in schools.', translation: 'Tôi là Robert và hôm nay chúng ta thảo luận về việc có nên dạy lập trình trong trường học hay không.', startTime: 3.5, endTime: 7.5 },
        { text: 'It is certainly a hot topic in education around the world.', translation: 'Đó chắc chắn là một chủ đề nóng trong giáo dục trên toàn thế giới.', startTime: 7.5, endTime: 10.5 },
        { text: 'My co-host Becky has some strong opinions about this.', translation: 'Đồng nghiệp của tôi Becky có một số quan điểm mạnh mẽ về điều này.', startTime: 10.5, endTime: 13.5 },
        { text: 'Well Robert, I think every child should learn to code just like they learn to read and write.', translation: 'Chà Robert, tôi nghĩ mọi đứa trẻ nên học lập trình giống như đọc và viết.', startTime: 13.5, endTime: 18 },
        { text: 'That is a bold statement. Why do you think that?', translation: 'Đó là một tuyên bố táo bạo. Tại sao bạn nghĩ vậy?', startTime: 18, endTime: 21 },
        { text: 'Because coding teaches problem solving, logical thinking, and creativity.', translation: 'Bởi vì lập trình dạy giải quyết vấn đề, tư duy logic và sáng tạo.', startTime: 21, endTime: 25 },
        { text: 'In the digital age, understanding technology is just as important as traditional literacy.', translation: 'Trong thời đại số, hiểu về công nghệ quan trọng không kém văn hóa đọc viết truyền thống.', startTime: 25, endTime: 30 },
        { text: 'I agree that these skills are valuable, but I wonder if we are putting too much pressure on young children.', translation: 'Tôi đồng ý những kỹ năng này rất giá trị, nhưng tôi tự hỏi liệu chúng ta có đang gây áp lực quá lớn lên trẻ nhỏ.', startTime: 30, endTime: 35 },
        { text: 'That is a fair point. Perhaps coding should be introduced gradually, starting with simple visual programming.', translation: 'Đó là một điểm hợp lý. Có lẽ lập trình nên được giới thiệu dần dần, bắt đầu với lập trình trực quan đơn giản.', startTime: 35, endTime: 40 },
      ],
      language: 'en'
    }),
    fetchYouTubeSubtitlesByLang: async () => ({
      sentences: [
        { text: 'Welcome to today\'s episode.', translation: 'Chào mừng các bạn đến với tập phim hôm nay.', startTime: 0, endTime: 3 },
        { text: 'Today we discuss an important topic.', translation: 'Hôm nay chúng ta thảo luận về một chủ đề quan trọng.', startTime: 3, endTime: 6 },
      ],
      language: 'en'
    }),
    parseManualTranscript: async (text: string) => {
      const lines = text.split('\n').filter(l => l.trim())
      return lines.map((line, i) => ({
        text: line.trim(),
        startTime: i * 3,
        endTime: (i + 1) * 3
      }))
    },
    scrapeUrl: async (url: string) => ({
      title: 'Imported Article',
      description: 'Article content from the provided URL',
      content: `This is the full content extracted from ${url}. It contains rich text about the topic that can be used for reading comprehension exercises, vocabulary learning, and grammar analysis.`
    }),
    fetchPodcastEpisodes: async () => [
      { id: 1, title: 'The Future of AI in Education', source: 'BBC 6 Minute English', duration: '6:12', audioUrl: '',
        transcript: [
          'Artificial intelligence is transforming education worldwide.',
          'Teachers can now use AI to personalize learning for each student.',
          'Some experts worry that technology might replace human teachers entirely.',
          'However, most agree that AI is a tool to enhance, not replace, teaching.',
        ],
        needsTranscript: false },
      { id: 2, title: 'Climate Change and Young Activists', source: 'VOA Learning English', duration: '5:45', audioUrl: '',
        transcript: [
          'Young people around the world are speaking out about climate change.',
          'They believe adults have not done enough to protect the planet.',
        ],
        needsTranscript: false },
      { id: 3, title: 'How to Build Better Habits', source: 'TED Talks', duration: '8:30', audioUrl: '',
        transcript: [
          'Building good habits is one of the most important things you can do.',
          'Start small and be consistent. Even tiny changes can lead to remarkable results.',
          'The key is to make your habits so easy that you cannot say no.',
        ],
        needsTranscript: false },
    ],
    translateBatch: async (sentences: string[]) => sentences.map(s => `Vietnamese translation: ${s}`),
    fetchDatamuse: async (_query: string) => [
      { word: 'synonym1', score: 0.9 }, { word: 'synonym2', score: 0.85 },
      { word: 'synonym3', score: 0.8 }, { word: 'synonym4', score: 0.75 },
    ],
    fetchWordNetwork: async (_word: string) => ({
      synonyms: ['similar1', 'similar2', 'similar3'],
      associations: ['related1', 'related2', 'related3']
    }),
    fetchYouTubeRSSByChannel: async (channelId?: string) => {
      if (!channelId) return []
      const channels = await mockApi.content.fetchYouTubeRSS()
      return channels.find(c => c.channel.toLowerCase().replace(/\s/g, '') === channelId)?.episodes || []
    },
    saveYouTubeEpisode: async (_ep: any) => {
      return { success: true, id: Date.now() }
    },
  },

  ai: {
    chat: async (provider: string, messages: any[], _system?: string) => {
      const lastMsg = messages[messages.length - 1]?.content || ''
      if (provider === 'claude') {
        return `Based on your question "${lastMsg.substring(0, 50)}...", here is my response. Remember to practice consistently and use context clues when learning new vocabulary. Would you like me to explain any grammar points in more detail?`
      }
      return `Great question! Let me help you with that. Here is a comprehensive response to your query about language learning. Keep practicing and you will see improvement over time.`
    },
    isAvailable: async (provider: string) => {
      if (provider === 'claude') return false
      return true
    },
    adaptArticle: async (text: string, level: string) =>
      `[${level} level adaptation] ${text.substring(0, 300)}... This text has been adapted for ${level} English learners with simpler vocabulary and shorter sentences.`,
    summarizeContent: async (_content: string) =>
      `AI Summary: This article discusses important topics in language learning. Key points include the importance of consistent practice, the benefits of immersion, and effective strategies for building vocabulary. The article emphasizes that learning a language is a journey that requires patience and dedication.`
  },

  shadowing: {
    save: async (_data: any) => {
      return { success: true }
    },
    saveBatch: async (attempts: any) => {
      return attempts.length || 1
    },
    getProgress: async () => [
      { sentence_index: 0, best_score: 85, best_attempts: 3, passed: 1 },
      { sentence_index: 1, best_score: 78, best_attempts: 5, passed: 1 },
      { sentence_index: 2, best_score: 92, best_attempts: 2, passed: 1 },
    ],
    getStats: async () => ({
      totalSessions: 15, avgScore: 78, sentencesCompleted: 45, totalAttempts: 120
    }),
    getWeakSentences: async () => [
      { sentence_index: 2, sentence_text: 'The quick brown fox jumps over the lazy dog.', sentence_translation: 'Con cáo nâu nhanh nhẹn nhảy qua chú chó lười.', best_score: 65, best_attempts: 5 },
      { sentence_index: 5, sentence_text: 'I would have gone to the party if I had known about it.', sentence_translation: 'Tôi đã đi dự tiệc nếu tôi biết về nó.', best_score: 70, best_attempts: 4 },
    ],
    getHistory: async (limit?: number) => [{
      episode_type: 'youtube', episode_id: 'bbc_001', sentence_text: 'Welcome to 6 Minute English.',
      match_score: 85, mode: 'learn', created_at: daysAgo(1)
    }].slice(0, limit || 10),
    getStreak: async () => ({ streak: 5, dates: [daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4)] }),
    analyzePronunciation: async (data: any) => ({
      score: 75 + Math.floor(Math.random() * 20),
      phoneme_breakdown: [
        { word: data?.sentenceText?.split(' ')[0] || 'think', phoneme: '/θ/', issue: 'Try pressing tongue between teeth', suggestion: 'Practice the /θ/ sound' },
        { word: 'th', phoneme: '/ð/', issue: 'Voice the sound more', suggestion: 'Add vocal cord vibration' },
      ],
      overall_feedback: 'Good effort! Focus on consonant clusters and the th sound.'
    })
  },

  learning: {
    mark: async (_data: any) => ({ toggled: true, nowLearnt: true }),
    getHistory: async ({ limit = 100 } = {}) => ({
      items: Array.from({ length: Math.min(20, limit) }, (_, i) => ({
        id: i + 1, type: ['video', 'audio', 'article', 'lesson', 'shadowing'][i % 5],
        item_id: `item_${i}`, item_title: [
          '6 Minute English: Coding in Schools', 'BBC Pronunciation Tips', 'VOA Climate Change',
          'TED: Language Learning Power', 'Business English Negotiation', 'Reading: AI in Healthcare',
          'News: Remote Work Trends', 'Listening: Present Perfect', 'Grammar: Articles',
          'Shadowing: TH Sound Practice', 'Video: TED Talks', 'Article: Global Migration',
          'Podcast: AI in Education', 'Reading: Climate Summit', 'Listening: Everyday Expressions',
          'Video: VOA American History', 'Article: Persuasive Writing', 'Lesson: Morning Routines',
          'Shadowing: Future Tenses', 'Video: TED Creative Thinking'
        ][i],
        source: ['YouTube', 'BBC LE', 'VOA', 'TED', 'Business English', 'News', 'News', 'Lesson', 'Lesson', 'YouTube', 'TED', 'Guardian', 'Podcast', 'VOA', 'Lesson', 'VOA', 'Guardian', 'Lesson', 'YouTube', 'TED'][i],
        cefr_level: ['B1', 'A2', 'B1', 'B2', 'C1', 'B2', 'B1', 'B1', 'B1', 'A2', 'C1', 'B1', 'B2', 'B1', 'B1', 'B1', 'C1', 'B1', 'B2', 'B2'][i],
        completed: i % 3 === 0 ? 1 : 0,
        completed_at: i % 3 === 0 ? daysAgo(i % 7) : null,
        added_at: daysAgo(i + 1)
      })),
      total: 20
    }),
    getStats: async () => ({
      total: 45, learnt: 23, todayLearnt: 3, thisWeekLearnt: 12,
      byType: [{ type: 'video', c: 15 }, { type: 'audio', c: 10 }, { type: 'article', c: 12 }, { type: 'lesson', c: 8 }],
      recentLearnt: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1, type: ['video', 'audio', 'article', 'lesson', 'shadowing'][i],
        item_id: `recent_${i}`, item_title: [
          '6 Minute English', 'BBC Pronunciation', 'AI in Healthcare', 'Present Perfect Lesson', 'TH Sound Practice'
        ][i],
        source: ['YouTube', 'BBC LE', 'News', 'Reading', 'YouTube'][i],
        cefr_level: 'B2', completed_at: daysAgo(i)
      }))
    }),
    getRecent: async (limit = 20) => Array.from({ length: Math.min(limit, 6) }, (_, i) => ({
      type: ['video', 'audio', 'article', 'lesson', 'shadowing', 'video'][i],
      item_id: `recent_${i}`,
      item_title: ['6 Minute English', 'BBC Pronunciation', 'AI in Healthcare', 'Present Perfect', 'TH Sound', 'TED Talk'][i],
      source: ['YouTube', 'BBC LE', 'News', 'Reading', 'YouTube', 'TED'][i],
      cefr_level: 'B2', completed_at: daysAgo(i)
    })),
    getByDate: async () => ({
      today: Array.from({ length: 3 }, (_, i) => ({
        id: `today_${i}`, type: 'lesson', item_id: `today_${i}`,
        item_title: `Today's Lesson #${i + 1}`,
        source: 'Reading', cefr_level: 'B1', completed_at: new Date().toISOString()
      })),
      thisWeek: Array.from({ length: 8 }, (_, i) => ({
        id: `week_${i}`, type: ['video', 'audio', 'article'][i % 3], item_id: `week_${i}`,
        item_title: `Week Item #${i + 1}`, source: 'Podcast', cefr_level: 'B2', completed_at: daysAgo(i)
      })),
      thisMonth: Array.from({ length: 15 }, (_, i) => ({
        id: `month_${i}`, type: 'lesson', item_id: `month_${i}`,
        item_title: `Month Item #${i + 1}`, source: 'News', cefr_level: 'C1', completed_at: daysAgo(i * 2)
      })),
      allTime: Array.from({ length: 20 }, (_, i) => ({
        id: `all_${i}`, type: ['video', 'audio', 'article', 'lesson'][i % 4], item_id: `all_${i}`,
        item_title: `All Time Item #${i + 1}`, source: 'YouTube', cefr_level: 'B1', completed_at: daysAgo(i * 3)
      }))
    }),
    isLearnt: async () => false,
  },

  clipboard: {
    capture: async () => '',
    onCapture: () => () => {}
  }
}

// Helper functions (must be after mockApi definition for closure)
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---- Inject mock if window.api doesn't exist (Vite dev mode) ----
if (typeof window !== 'undefined' && !(window as any).api) {
  ;(window as any).api = mockApi
}
