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
}
