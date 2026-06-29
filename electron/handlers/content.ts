import { ipcMain } from 'electron'
import Parser from 'rss-parser'

const rssParser = new Parser()

export function registerContentHandlers(): void {
  ipcMain.handle('content:fetchRss', async (_event, url: string) => {
    const feed = await rssParser.parseURL(url)
    return feed
  })

  ipcMain.handle('content:fetchDictionary', async (_event, word: string) => {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )
    if (!res.ok) return null
    return res.json()
  })

  ipcMain.handle('content:fetchTranslation', async (_event, word: string) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`
    const res = await fetch(url)
    if (!res.ok) return word
    const data = (await res.json()) as { responseData?: { translatedText?: string } }
    return data.responseData?.translatedText ?? word
  })
}
