import { ipcMain } from 'electron'
import Parser from 'rss-parser'
import * as cheerio from 'cheerio'
import { getDb } from './db'

const rssParser = new Parser()

const NEWSAPI_KEY = process.env.NEWSAPI_KEY ?? '733d0d9c99f84bdabd6decaf0525b25a'

const YOUTUBE_CHANNELS = [
  { id: 'UCk-CP63XMk897PXXEhBizhw', name: 'BBC Learning English' },
  { id: 'UCwBnK6czOqJklP7QKXD6Q7g', name: 'VOA Learning English' },
  { id: 'UCsT0YIqwnpDLQM9kUhBflBw', name: 'TED' },
  { id: 'UCq-Ci6GMl1MBJCR3h1Ne4Aw', name: 'English with Lucy' },
  { id: 'UCJ6qMvjwEXhjoSNEV1jpfJA', name: 'mmmEnglish' },
  { id: 'UCvI5nZFolLpXpFPA3gAGUQg', name: 'English Addict with Mr Steve' },
]

interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: {
    title: string
    description: string
    url: string
    urlToImage: string
    publishedAt: string
    source: { name: string }
  }[]
}

interface WiktionaryEntry {
  extract?: string
  definitions?: { definition: string; examples?: string[] }[]
  etymologies?: { explanation?: string }[]
}

interface GuardianResponse {
  status: string
  results: {
    id: string
    webTitle: string
    webUrl: string
    sectionName: string
    webPublicationDate: string
    pillarName: string
    fields?: { byline: string; firstPublicationDate: string; body: string }
  }[]
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export function registerContentHandlers(): void {
  // --- RSS ---
  ipcMain.handle('content:fetchRss', async (_event, url: string) => {
    return rssParser.parseURL(url)
  })

  // --- NewsAPI.org ---
  ipcMain.handle(
    'content:fetchNewsAPI',
    async (_event, category?: string, apiKey?: string) => {
      const key = apiKey ?? NEWSAPI_KEY
      const catParam = category ? `&category=${category}` : ''
      const url = `https://newsapi.org/v2/top-headlines?country=us${catParam}&apiKey=${key}`
      const data = await fetchJson<NewsAPIResponse>(url)
      return data?.articles ?? []
    }
  )

  // --- BBC Learning English API ---
  ipcMain.handle('content:fetchBBCLE', async (_event, filter?: string) => {
    const filterParam = filter ? `&filter=${filter}` : ''
    const url = `https://learningenglish.bbc.com/api/v2/media.json${filterParam}&limit=20`
    const data = await fetchJson<any>(url)
    if (!data) return []
    const items = data.media || []
    return items.map((item: any) => ({
      title: item.headlines?.headline || item.title,
      description: item.summary?.text || '',
      url: item.url,
      imageUrl: item.image?.image?.url || '',
      publishedAt: item.publish_date,
      type: item.type,
      level: item.level,
      audioUrl: item.audio?.url || '',
      transcript: item.transcript || '',
    }))
  })

  // --- Guardian Open Platform ---
  ipcMain.handle(
    'content:fetchGuardianArticles',
    async (_event, topic?: string, page = 1) => {
      const section = topic ? `&section=${topic}` : ''
      const url = `https://content.guardianapis.com/search?order-by=newest${section}&page=${page}&page-size=20&api-token=`
      const data = await fetchJson<GuardianResponse>(url)
      return data?.results ?? []
    }
  )

  // --- YouTube RSS Feeds ---
  ipcMain.handle('content:fetchYouTubeRSS', async (_event, channelId?: string) => {
    if (channelId) {
      const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      const feed = rssParser.parseURL(url) as unknown as {
        feed: { title: string; id: string }
        entries: { id: string; title: string; published: string; link: string }[]
      }
      return feed?.entries?.map((e) => ({
        videoId: e.id.replace('yt:video:', ''),
        title: e.title,
        channel: feed.feed?.title || '',
        publishedAt: e.published,
        url: e.link,
      })) ?? []
    }
    // Return all channels with their episodes
    const all: { channel: string; episodes: any[] }[] = []
    for (const ch of YOUTUBE_CHANNELS) {
      const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`
      const feed = rssParser.parseURL(url) as unknown as {
        feed: { title: string }
        entries: { id: string; title: string; published: string; link: string }[]
      }
      all.push({
        channel: ch.name,
        episodes: (feed?.entries || []).map((e) => ({
          videoId: e.id.replace('yt:video:', ''),
          title: e.title,
          channel: ch.name,
          publishedAt: e.published,
          url: e.link,
        })),
      })
    }
    return all
  })

  // --- YouTube RSS for a single channel ---
  ipcMain.handle('content:fetchYouTubeChannel', async (_event, channelId?: string) => {
    const ch = YOUTUBE_CHANNELS.find((c) => c.id === channelId)
    if (!channelId || !ch) return []
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const feed = rssParser.parseURL(url) as unknown as {
      feed: { title: string }
      entries: { id: string; title: string; published: string; link: string }[]
    }
    return (feed?.entries || []).map((e) => ({
      videoId: e.id.replace('yt:video:', ''),
      title: e.title,
      channel: ch.name,
      publishedAt: e.published,
      url: e.link,
    }))
  })

  // --- Datamuse API (word associations) ---
  ipcMain.handle(
    'content:fetchDatamuse',
    async (_event, query: string, relSyn?: string) => {
      let url = `https://api.datamuse.com/words?md=r&max=20`
      if (relSyn) {
        url += `&rel_syn=${encodeURIComponent(query)}`
      } else {
        url += `&sp=${encodeURIComponent(query)}&max=20`
      }
      const data = await fetchJson<{ word: string; score: number }[]>(url)
      return (data || []).map((d) => ({
        word: d.word,
        score: d.score,
      }))
    }
  )

  // --- Wiktionary API ---
  ipcMain.handle('content:fetchWiktionary', async (_event, word: string) => {
    const url = `https://en.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=false&titles=${encodeURIComponent(word)}`
    const data = await fetchJson<{ query?: { pages?: { [key: string]: WiktionaryEntry } } }>(url)
    const page = data?.query?.pages ? Object.values(data.query.pages)[0] : null
    if (!page) return null
    return {
      extract: page.extract || '',
      definitions: page.definitions || [],
      etymologies: page.etymologies || [],
    }
  })

  // --- Cambridge Dictionary (collocations) ---
  ipcMain.handle('content:fetchCambridge', async (_event, word: string) => {
    const url = `https://dictionaryapi.dev/api/v3/references/collocation/json/${encodeURIComponent(word)}?key=cd8e2769-5e7e-4a0f-8e0e-6e7d4d1e9f3a`
    const data = await fetchJson<any[]>(url)
    if (!data || data.length === 0) return null
    const entry = data.find((d) => d.hwp) || data[0]
    return {
      word: entry.text || entry.hwp?.[0]?.v || word,
      collocations: entry.collocations || [],
      pronunciations: entry.pronunciations || [],
    }
  })

  // --- Quotable.io (random quotes) ---
  ipcMain.handle('content:fetchQuotable', async (_event, limit = 5) => {
    const url = `https://api.quotable.io/random?minLength=50&maxLength=300&_limit=${limit}`
    const data = await fetchJson<{ content: string; author: string }[]>(url)
    return data || []
  })

  // --- Word of the Day (Merriam-Webster) ---
  ipcMain.handle('content:fetchWordOfTheDay', async () => {
    try {
      const res = await fetch('https://www.merriam-webster.com/words-at-play')
      const html = await res.text()
      const $ = cheerio.load(html)
      const wotdEl = $('.wotd-entry-title').first()
      if (wotdEl.length === 0) return null
      const word = wotdEl.text().trim()
      return {
        word,
        url: 'https://www.merriam-webster.com/words-at-play',
      }
    } catch {
      return null
    }
  })

  // --- Scrape URL (cheerio-based content extraction) ---
  ipcMain.handle('content:scrapeUrl', async (_event, url: string) => {
    try {
      const res = await fetch(url)
      const html = await res.text()
      const $ = cheerio.load(html)
      $('script, style, nav, footer, header, aside, .sidebar, .nav, .comment').remove()
      const text = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 10000)
      const title = $('title').text().trim() || $('h1').first().text().trim()
      const description = $('meta[name="description"]').attr('content') || ''
      return { title, description, content: text }
    } catch {
      return { title: '', description: '', content: '' }
    }
  })

  // --- Save YouTube Episode ---
  ipcMain.handle(
    'content:saveYouTubeEpisode',
    async (
      _event,
      data: {
        videoId: string
        title: string
        channel: string
        duration?: string
        thumbnail?: string
        publishedAt: string
        level?: string
      }
    ) => {
      const db = getDb()
      db.prepare(
        `INSERT INTO youtube_episodes (video_id, title, channel, duration, thumbnail, published_at, level, saved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(video_id) DO UPDATE SET
           title = ?, channel = ?, level = ?`
      ).run(
        data.videoId, data.title, data.channel, data.duration,
        data.thumbnail, data.publishedAt, data.level ?? 'B1',
        data.title, data.channel, data.level ?? 'B1'
      )
      return true
    }
  )

  // --- Word Network (synonyms + associations) ---
  ipcMain.handle('content:fetchWordNetwork', async (_event, word: string) => {
    try {
      // Get synonyms
      const synUrl = `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=15`
      const synData = await fetchJson<{ word: string; score: number }[]>(synUrl)
      const synonyms = (synData || []).filter(d => d.word.toLowerCase() !== word.toLowerCase()).map(d => d.word).slice(0, 12)

      // Get associations
      const assocUrl = `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=12`
      const assocData = await fetchJson<{ word: string; score: number }[]>(assocUrl)
      const synonymSet = new Set(synonyms.map(s => s.toLowerCase()))
      const associations = (assocData || [])
        .filter(d => d.word.toLowerCase() !== word.toLowerCase() && !synonymSet.has(d.word.toLowerCase()))
        .map(d => d.word)
        .slice(0, 8)

      return { synonyms, associations }
    } catch {
      return { synonyms: [], associations: [] }
    }
  })

  // --- YouTube Subtitle Helpers ---
  function decodeEntities(str: string): string {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#60;/g, '<')
      .replace(/&#62;/g, '>')
  }

  function parseXmlCaptions(xml: string): { sentences: { text: string; startTime: number; endTime: number }[]; language: string } {
    const sentences: { text: string; startTime: number; endTime: number }[] = []
    let detectedLanguage = 'en'

    // Detect language from XML attributes
    const langMatch = xml.match(/lang_code="?([a-zA-Z_-]+)"?/) || xml.match(/language_code="?([a-zA-Z_-]+)"?/)
    if (langMatch) {
      const code = langMatch[1]
      detectedLanguage = code.includes('en') ? 'en' : code.includes('vi') ? 'vi' : code.includes('ko') ? 'ko' : code.includes('ja') ? 'ja' : code.includes('zh') ? 'zh' : code.includes('fr') ? 'fr' : code.includes('de') ? 'de' : code.includes('es') ? 'es' : code.includes('pt') ? 'pt' : code.includes('ru') ? 'ru' : code.includes('ar') ? 'ar' : code.includes('hi') ? 'hi' : 'en'
    }

    // Detect language name from XML
    const nameMatch = xml.match(/language="?([^">]+)"?/)
    if (nameMatch) {
      const name = nameMatch[1].toLowerCase()
      if (name.includes('english')) detectedLanguage = 'en'
      else if (name.includes('vietnam')) detectedLanguage = 'vi'
      else if (name.includes('korean')) detectedLanguage = 'ko'
      else if (name.includes('japanese')) detectedLanguage = 'ja'
      else if (name.includes('chinese')) detectedLanguage = 'zh'
      else if (name.includes('french')) detectedLanguage = 'fr'
      else if (name.includes('german')) detectedLanguage = 'de'
      else if (name.includes('spanish')) detectedLanguage = 'es'
      else if (name.includes('portuguese')) detectedLanguage = 'pt'
      else if (name.includes('russian')) detectedLanguage = 'ru'
      else if (name.includes('arabic')) detectedLanguage = 'ar'
      else if (name.includes('hindi')) detectedLanguage = 'hi'
    }

    // Try <p> element format (newer YouTube subtitles): <p start="12.5" dur="3.2">text here</p>
    const pTags = xml.match(/<p\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)
    if (pTags && pTags.length > 0) {
      for (const pTag of pTags) {
        const startMatch = pTag.match(/start="([^"]+)"/)
        const durMatch = pTag.match(/dur="([^"]+)"/)
        const textMatch = pTag.match(/>([\s\S]*?)<\/p>$/)

        if (startMatch && durMatch && textMatch) {
          const start = parseFloat(startMatch[1])
          const dur = parseFloat(durMatch[1])
          let text = decodeEntities(textMatch[1].replace(/\s+/g, ' '))

          // Remove nested HTML tags like <b>, <i>, etc.
          text = text.replace(/<\/?[a-zA-Z][^>]*>/g, '').trim()

          if (text.length > 0) {
            sentences.push({
              text,
              startTime: start,
              endTime: start + dur
            })
          }
        }
      }
    }

    // Try <transcript> format: <transcript start="12.5" dur="3.2">text</transcript>
    if (sentences.length === 0) {
      const transcriptTags = xml.match(/<transcript\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/transcript>/g)
      if (transcriptTags) {
        for (const tTag of transcriptTags) {
          const startMatch = tTag.match(/start="([^"]+)"/)
          const durMatch = tTag.match(/dur="([^"]+)"/)
          const textMatch = tTag.match(/>([\s\S]*?)<\/transcript>$/)

          if (startMatch && durMatch && textMatch) {
            const start = parseFloat(startMatch[1])
            const dur = parseFloat(durMatch[1])
            let text = decodeEntities(textMatch[1].replace(/\s+/g, ' '))
            text = text.replace(/<\/?[a-zA-Z][^>]*>/g, '').trim()

            if (text.length > 0) {
              sentences.push({
                text,
                startTime: start,
                endTime: start + dur
              })
            }
          }
        }
      }
    }

    // Try traditional <text> tag format: <text start="12.5" dur="3.2">text</text>
    if (sentences.length === 0) {
      const textTags = xml.match(/<text\s+[^>]*start="([^"]+)"\s+[^>]*dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g)
      if (textTags) {
        for (const tTag of textTags) {
          const startMatch = tTag.match(/start="([^"]+)"/)
          const durMatch = tTag.match(/dur="([^"]+)"/)
          const textMatch = tTag.match(/>([\s\S]*?)<\/text>$/)

          if (startMatch && durMatch && textMatch) {
            const start = parseFloat(startMatch[1])
            const dur = parseFloat(durMatch[1])
            let text = decodeEntities(textMatch[1].replace(/\s+/g, ' '))
            text = text.replace(/<\/?[a-zA-Z][^>]*>/g, '').trim()

            if (text.length > 0) {
              sentences.push({
                text,
                startTime: start,
                endTime: start + dur
              })
            }
          }
        }
      }
    }

    // Try alternate text tag ordering: <text dur="3.2" start="12.5">text</text>
    if (sentences.length === 0) {
      const textTags = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g)
      if (textTags) {
        for (const tTag of textTags) {
          const startMatch = tTag.match(/start="([^"]+)"/)
          const durMatch = tTag.match(/dur="([^"]+)"/)
          const textMatch = tTag.match(/>([\s\S]*?)<\/text>$/)

          if (startMatch && durMatch && textMatch) {
            const start = parseFloat(startMatch[1])
            const dur = parseFloat(durMatch[1])
            let text = decodeEntities(textMatch[1].replace(/\s+/g, ' '))
            text = text.replace(/<\/?[a-zA-Z][^>]*>/g, '').trim()

            if (text.length > 0) {
              sentences.push({
                text,
                startTime: start,
                endTime: start + dur
              })
            }
          }
        }
      }
    }

    // Merge consecutive short segments into sentences
    if (sentences.length > 1) {
      const merged: { text: string; startTime: number; endTime: number }[] = []
      let current = { ...sentences[0] }

      for (let i = 1; i < sentences.length; i++) {
        const next = sentences[i]
        const gap = next.startTime - current.endTime

        if (gap < 1.5 && current.text.length < 200 && next.text.length < 200) {
          // Merge: close sentence if current ends without punctuation and next doesn't start a new one
          const currentEndsSentence = /[.!?,;:]/.test(current.text.trim().slice(-1))
          const nextStartsCapital = /^[A-Z]/.test(next.text.trim())

          if (currentEndsSentence && nextStartsCapital) {
            // Push current and start new
            merged.push(current)
            current = { ...next }
          } else {
            // Merge into current
            current.text += ' ' + next.text
            current.endTime = next.endTime
          }
        } else {
          merged.push(current)
          current = { ...next }
        }
      }
      merged.push(current)
      sentences.length = 0
      sentences.push(...merged)
    }

    return { sentences, language: detectedLanguage }
  }

  // --- YouTube Subtitles ---
  ipcMain.handle('content:fetchYouTubeSubtitles', async (_event, videoId: string) => {
    const langAttempts = ['en', 'en-US', 'en-GB', 'vi', 'auto']

    for (const lang of langAttempts) {
      const urls = [
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&type=ttml`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&type=html`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&type=captions`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`,
      ]

      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (!res.ok) continue

          const xml = await res.text()
          if (!xml || xml.trim().length < 10) continue

          const result = parseXmlCaptions(xml)
          if (result.sentences.length > 0) {
            return result
          }
        } catch {
          continue
        }
      }
    }

    // Fallback: try all caption types without language
    const types = ['captions', 'manual', 'default', '']
    for (const type of types) {
      const typeParam = type ? `&type=${type}` : ''
      const urls = [
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en${typeParam}`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US${typeParam}`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-GB${typeParam}`,
        `https://www.youtube.com/api/timedtext?v=${videoId}${typeParam}`,
      ]

      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (!res.ok) continue

          const xml = await res.text()
          if (!xml || xml.trim().length < 10) continue

          const result = parseXmlCaptions(xml)
          if (result.sentences.length > 0) {
            return result
          }
        } catch {
          continue
        }
      }
    }

    return { sentences: [], language: 'unknown' }
  })

  // --- YouTube Subtitles By Language ---
  ipcMain.handle('content:fetchYouTubeSubtitlesByLang', async (_event, videoId: string, langCode: string) => {
    const formats = ['ttml', 'html', 'captions']

    for (const format of formats) {
      const urls = [
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${langCode}&type=${format}`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${langCode}`,
      ]

      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (!res.ok) continue

          const xml = await res.text()
          if (!xml || xml.trim().length < 10) continue

          const result = parseXmlCaptions(xml)
          if (result.sentences.length > 0) {
            return result
          }
        } catch {
          continue
        }
      }
    }

    return { sentences: [], language: 'unknown' }
  })

  // --- Parse Manual Transcript ---
  ipcMain.handle('content:parseManualTranscript', async (_event, text: string) => {
    // Parse manually pasted transcript into sentences
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const sentences: { text: string; startTime: number; endTime: number }[] = []

    let currentTime = 0
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Check if line has a timestamp
      const tsMatch = trimmed.match(/(\d{1,2}):(\d{2})(?:\.(\d{3}))?\s*[-–>]\s*/)
      if (tsMatch) {
        const mins = parseInt(tsMatch[1])
        const secs = parseInt(tsMatch[2])
        const ms = tsMatch[3] ? parseInt(tsMatch[3].padEnd(3, '0')) : 0
        currentTime = mins * 60 + secs + ms / 1000

        const textAfterArrow = trimmed.split(/[-–>]\s*/).slice(1).join(' ').trim()
        if (textAfterArrow) {
          sentences.push({
            text: textAfterArrow,
            startTime: currentTime,
            endTime: currentTime + 3 // default 3s per sentence
          })
        }
      } else {
        // No timestamp, just treat as a sentence
        if (trimmed.length > 3) {
          sentences.push({
            text: trimmed,
            startTime: currentTime,
            endTime: currentTime + 3
          })
          currentTime += 3
        }
      }
    }

    // If no timestamps found, split by period/question/exclamation + space
    if (sentences.length === 0 && text.includes('. ')) {
      const parts = text.split(/(?<=[.!?])\s+/)
      let time = 0
      for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed.length > 3) {
          sentences.push({
            text: trimmed,
            startTime: time,
            endTime: time + 3
          })
          time += 3
        }
      }
    }

    return sentences
  })

  // --- Dictionary ---
  ipcMain.handle('content:fetchDictionary', async (_event, word: string) => {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )
    if (!res.ok) return null
    return res.json()
  })

  // --- Translation ---
  ipcMain.handle('content:fetchTranslation', async (_event, word: string) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`
    const res = await fetch(url)
    if (!res.ok) return word
    const data = (await res.json()) as { responseData?: { translatedText?: string } }
    return data.responseData?.translatedText ?? word
  })

  // --- Generate Podcast Transcript (AI-assisted simulated transcript) ---
  ipcMain.handle(
    'content:generatePodcastTranscript',
    async (_event, title: string, description: string, options?: { apiKey?: string; provider?: string }) => {
      const provider = options?.provider ?? 'claude'
      const apiKey = options?.apiKey ?? ''
      if (!apiKey) {
        const fallbackSentences = generateFallbackTranscript(title, description)
        return { sentences: fallbackSentences, totalDuration: fallbackSentences.length * 4 }
      }

      try {
        const systemPrompt = `You are a podcast transcript generator and bilingual translator. Given a podcast title and description, generate a realistic English learning podcast transcript with Vietnamese translations.

Rules:
- Write 8-15 sentences appropriate for the described topic
- Keep sentences at an intermediate English level (B1-B2)
- Include a mix of short and medium-length sentences
- Each sentence should be natural and conversational
- Provide an accurate Vietnamese translation for each English sentence
- Return ONLY a JSON array of objects with exactly these fields: text (string, English), translation (string, Vietnamese), startTime (number), endTime (number). Do NOT include any other text, markdown, or explanation.
- startTime and endTime should be in seconds, incrementing naturally (each sentence ~3-5 seconds)
- Do NOT wrap the JSON in markdown code blocks`

        const userPrompt = `Podcast Title: ${title}\nDescription: ${description}\n\nGenerate the transcript with Vietnamese translations.`

        let response = ''
        if (provider === 'claude') {
          const anthropic = await import('@anthropic-ai/sdk')
          const client = new anthropic.Anthropic({ apiKey })
          const res = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 3072,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
          })
          response = res.content[0]?.type === 'text' ? res.content[0].text : ''
        } else {
          const res = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3.2',
              messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
              stream: false
            })
          })
          if (res.ok) {
            const data = await res.json() as { message?: { content: string } }
            response = data.message?.content ?? ''
          }
        }

        const cleanJson = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleanJson) as { text: string; translation?: string; startTime: number; endTime: number }[]
        const sentences = parsed.map(s => ({
          text: s.text,
          translation: s.translation || '',
          startTime: s.startTime,
          endTime: s.endTime
        }))
        return { sentences, totalDuration: parsed.length * 4 }
      } catch {
        const fallbackSentences = generateFallbackTranscript(title, description)
        return { sentences: fallbackSentences, totalDuration: fallbackSentences.length * 4 }
      }
    }
  )

  // --- Fetch Podcast Episodes (BBC LE + DB check) ---
  ipcMain.handle('content:fetchPodcastEpisodes', async () => {
    const bbcEpisodes = await fetchJson<any[]>(`https://learningenglish.bbc.com/api/v2/media.json?filter=podcast&limit=20`)
    if (!bbcEpisodes) return []

    const db = getDb()
    const savedUrls = new Set(
      db.prepare('SELECT url FROM saved_podcasts').pluck().all() as string[]
    )

    const episodes = bbcEpisodes.map((item: any) => {
      const url = item.url || ''
      const hasTranscript = !!item.transcript && item.transcript.trim().length > 0
      const isSaved = savedUrls.has(url)
      return {
        id: url,
        title: item.headlines?.headline || item.title,
        description: item.summary?.text || '',
        url,
        imageUrl: item.image?.image?.url || '',
        publishedAt: item.publish_date,
        type: item.type,
        level: item.level,
        audioUrl: item.audio?.url || '',
        transcript: hasTranscript ? item.transcript : '',
        needsTranscript: !hasTranscript && !isSaved,
        isSaved,
      }
    })

    return episodes
  })

  // --- Batch Translate Sentences to Vietnamese (MyMemory API) ---
  ipcMain.handle(
    'content:translateBatch',
    async (_event, sentences: string[]) => {
      if (!sentences.length) return []

      const db = getDb()
      const results: string[] = []
      const untranslated: { index: number; text: string }[] = []

      // Check cache first
      const cache = db.prepare('SELECT translation FROM translation_cache WHERE word = ?')
      const insertCache = db.prepare('INSERT OR REPLACE INTO translation_cache (word, translation, fetched_at) VALUES (?, ?, datetime(\'now\'))')

      for (let i = 0; i < sentences.length; i++) {
        const text = sentences[i]
        const cached = cache.pluck().get(text) as string | undefined
        if (cached) {
          results[i] = cached
        } else {
          untranslated.push({ index: i, text })
        }
      }

      // Fetch untranslated via MyMemory API
      if (untranslated.length > 0) {
        // MyMemory API has a limit of ~500 words/day for anonymous, ~5000 with email
        // Process in batches of 10 to avoid rate limiting
        const batch = untranslated.slice(0, 10)
        for (const item of batch) {
          try {
            const res = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(item.text)}&langpair=en|vi`
            )
            if (res.ok) {
              const data = await res.json() as { responseData?: { translatedText?: string } }
              const translation = data.responseData?.translatedText || item.text
              insertCache.get(item.text) || insertCache.run(item.text, translation)
              results[item.index] = translation
            } else {
              results[item.index] = item.text
            }
          } catch {
            results[item.index] = item.text
          }
        }
      }

      return results
    }
  )
}

function generateFallbackTranscript(title: string, description: string): { text: string; translation: string; startTime: number; endTime: number }[] {
  const sentences: { text: string; translation: string }[] = [
    { text: `Welcome to today's episode of ${title}.`, translation: `Chào mừng bạn đến với tập phim hôm nay của ${title}.` },
    { text: description.length > 100 ? description.substring(0, 100) + '...' : description || `Today we'll be discussing an important topic.`, translation: description.length > 100 ? description.substring(0, 100) + '...' : description || `Hôm nay chúng ta sẽ thảo luận về một chủ đề quan trọng.` },
    { text: `In this episode, we'll explore some key ideas and examples.`, translation: `Trong tập này, chúng ta sẽ khám phá một số ý tưởng và ví dụ quan trọng.` },
    { text: `Let's start by looking at the main concepts involved.`, translation: `Hãy bắt đầu bằng cách xem xét các khái niệm chính liên quan.` },
    { text: `First, it's important to understand the context we're working with.`, translation: `Đầu tiên, điều quan trọng là phải hiểu ngữ cảnh mà chúng ta đang làm việc.` },
    { text: `Many people find this topic both interesting and challenging.`, translation: `Nhiều người tìm chủ đề này vừa thú vị vừa thử thách.` },
    { text: `Now let's look at a practical example to illustrate the point.`, translation: `Bây giờ hãy xem một ví dụ thực tế để minh họa cho điểm này.` },
    { text: `As you can see, this concept applies in many real-world situations.`, translation: `Như bạn có thể thấy, khái niệm này áp dụng trong nhiều tình huống thực tế.` },
    { text: `Moving on, there are several important details to consider here.`, translation: `Tiếp theo, có một số chi tiết quan trọng cần xem xét ở đây.` },
    { text: `Let me share another example that might help clarify things.`, translation: `Hãy để tôi chia sẻ một ví dụ khác có thể giúp làm rõ vấn đề.` },
    { text: `These examples show how the ideas connect together.`, translation: `Những ví dụ này cho thấy các ý tưởng kết hợp với nhau như thế nào.` },
    { text: `To summarize what we've covered so far, the key points are clear.`, translation: `Để tóm tắt những gì chúng ta đã covered cho đến nay, các điểm chính rất rõ ràng.` },
    { text: `Thank you for listening. We hope you found this episode helpful.`, translation: `Cảm ơn bạn đã lắng nghe. Chúng tôi hy vọng bạn thấy tập này hữu ích.` },
  ]

  let currentTime = 0
  return sentences.map((s) => {
    const duration = 3 + Math.random() * 2
    const start = currentTime
    currentTime += duration
    return { text: s.text, translation: s.translation, startTime: Math.round(start * 100) / 100, endTime: Math.round(currentTime * 100) / 100 }
  })
}
