import { useCallback } from 'react'

export interface Pronunciation {
  region: 'US' | 'UK'
  ipa: string
  audio: string | null
}

export interface DefinitionItem {
  definition: string
  example: string | null
  synonyms: string[]
  antonyms: string[]
}

export interface Meaning {
  pos: string
  definitions: DefinitionItem[]
}

export interface DictEntry {
  word: string
  phonetics: { region: 'US' | 'UK'; ipa: string; audio: string | null }[]
  phonetic: string | null
  meanings: Meaning[]
  allSynonyms: string[]
  allAntonyms: string[]
}

function parseDictResponse(data: unknown[]): DictEntry | null {
  if (!Array.isArray(data) || data.length === 0) return null
  const entry = data[0] as {
    word: string
    phonetic?: string
    phonetics?: { text?: string; audio?: string; region?: string }[]
    meanings?: {
      partOfSpeech: string
      definitions: { definition: string; example?: string; synonyms?: string[]; antonyms?: string[] }[]
    }[]
  }

  // Extract US and UK pronunciations
  const phonetics = entry.phonetics || []
  const usPronunciation = phonetics.find(p => {
    if (!p.audio) return false
    const audio = p.audio.toLowerCase()
    return audio.includes('us') || audio.includes('ameri') || audio.includes('general')
  })
  const ukPronunciation = phonetics.find(p => {
    if (!p.audio) return false
    const audio = p.audio.toLowerCase()
    return audio.includes('uk') || audio.includes('gb') || audio.includes('brit') || audio.includes('non_us')
  })

  const phoneticsResult: DictEntry['phonetics'] = []
  if (usPronunciation?.audio) {
    phoneticsResult.push({ region: 'US', ipa: usPronunciation.text || '', audio: usPronunciation.audio })
  } else if (phonetics[0]?.audio) {
    phoneticsResult.push({ region: 'US', ipa: phonetics[0].text || '', audio: phonetics[0].audio })
  }
  if (ukPronunciation?.audio) {
    phoneticsResult.push({ region: 'UK', ipa: ukPronunciation.text ?? '', audio: ukPronunciation.audio })
  } else if (phonetics.find(p => p.text)) {
    const nonUs = phonetics.find(p => !phoneticsResult.some(r => r.audio === p.audio))
    if (nonUs) {
      phoneticsResult.push({ region: 'UK', ipa: nonUs.text ?? '', audio: nonUs.audio ?? null })
    }
  }

  const phonetic = entry.phonetic ?? phonetics.find(p => p.text)?.text ?? null

  const allSynonyms: string[] = []
  const allAntonyms: string[] = []

  const meanings = (entry.meanings ?? []).flatMap((m) => ({
    pos: m.partOfSpeech,
    definitions: m.definitions.map((d) => {
      if (d.synonyms) allSynonyms.push(...d.synonyms.filter(s => s.toLowerCase() !== entry.word.toLowerCase()))
      if (d.antonyms) allAntonyms.push(...d.antonyms.filter(a => a.toLowerCase() !== entry.word.toLowerCase()))
      return {
        definition: d.definition,
        example: d.example ?? null,
        synonyms: d.synonyms || [],
        antonyms: d.antonyms || []
      }
    })
  }))

  return {
    word: entry.word,
    phonetics: phoneticsResult,
    phonetic,
    meanings,
    allSynonyms: [...new Set(allSynonyms)].slice(0, 15),
    allAntonyms: [...new Set(allAntonyms)].slice(0, 10)
  }
}

export function useDictionary() {
  const lookup = useCallback(async (word: string): Promise<DictEntry | null> => {
    const clean = word.trim().toLowerCase()
    if (!clean || clean.split(' ').length > 3) return null

    // Check cache first
    const cached = await window.api.db.query(
      'SELECT data FROM dictionary_cache WHERE word = ?',
      [clean]
    ) as { data: string } | undefined

    if (cached) {
      const parsed = parseDictResponse(JSON.parse(cached.data))
      return parsed
    }

    // Fetch from API
    const data = await window.api.content.fetchDictionary(clean)
    if (!data) return null

    // Cache it
    await window.api.db.run(
      'INSERT OR REPLACE INTO dictionary_cache (word, data) VALUES (?, ?)',
      [clean, JSON.stringify(data)]
    )

    return parseDictResponse(data as unknown[])
  }, [])

  const translate = useCallback(async (word: string): Promise<string> => {
    const clean = word.trim().toLowerCase()
    if (!clean) return word

    const cached = await window.api.db.query(
      'SELECT translation FROM translation_cache WHERE word = ?',
      [clean]
    ) as { translation: string } | undefined

    if (cached) return cached.translation

    const translation = await window.api.content.fetchTranslation(clean)

    await window.api.db.run(
      'INSERT OR REPLACE INTO translation_cache (word, translation) VALUES (?, ?)',
      [clean, translation]
    )

    return translation
  }, [])

  const fetchWordNetwork = useCallback(async (word: string): Promise<{ synonyms: string[]; associations: string[] }> => {
    const clean = word.trim().toLowerCase()
    if (!clean) return { synonyms: [], associations: [] }

    const result = await window.api.content.fetchDatamuse(clean, 'rel_syn') as { word: string; score: number }[]
    if (!result) return { synonyms: [], associations: [] }

    const synonyms = result.filter(d => d.word !== clean).slice(0, 12).map(d => d.word)

    const assocResult = await window.api.content.fetchDatamuse(clean) as { word: string; score: number }[]
    const associations = (assocResult || [])
      .filter(d => d.word !== clean && !synonyms.includes(d.word))
      .slice(0, 8)
      .map(d => d.word)

    return { synonyms, associations }
  }, [])

  return { lookup, translate, fetchWordNetwork }
}
