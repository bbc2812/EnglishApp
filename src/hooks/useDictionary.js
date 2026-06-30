import { useCallback } from 'react';
function parseDictResponse(data) {
    if (!Array.isArray(data) || data.length === 0)
        return null;
    const entry = data[0];
    const phonetics = entry.phonetics ?? [];
    const audio = phonetics.find((p) => p.audio)?.audio ?? null;
    const phonetic = entry.phonetic ?? phonetics.find((p) => p.text)?.text ?? null;
    const meanings = (entry.meanings ?? []).flatMap((m) => m.definitions.slice(0, 2).map((d) => ({
        pos: m.partOfSpeech,
        definition: d.definition,
        example: d.example ?? null
    }))).slice(0, 5);
    return { word: entry.word, phonetic, audio, meanings };
}
export function useDictionary() {
    const lookup = useCallback(async (word) => {
        const clean = word.trim().toLowerCase();
        if (!clean || clean.split(' ').length > 3)
            return null;
        // Check cache first
        const cached = await window.api.db.query('SELECT data FROM dictionary_cache WHERE word = ?', [clean]);
        if (cached) {
            const parsed = parseDictResponse(JSON.parse(cached.data));
            return parsed;
        }
        // Fetch from API
        const data = await window.api.content.fetchDictionary(clean);
        if (!data)
            return null;
        // Cache it
        await window.api.db.run('INSERT OR REPLACE INTO dictionary_cache (word, data) VALUES (?, ?)', [clean, JSON.stringify(data)]);
        return parseDictResponse(data);
    }, []);
    const translate = useCallback(async (word) => {
        const clean = word.trim().toLowerCase();
        if (!clean)
            return word;
        const cached = await window.api.db.query('SELECT translation FROM translation_cache WHERE word = ?', [clean]);
        if (cached)
            return cached.translation;
        const translation = await window.api.content.fetchTranslation(clean);
        await window.api.db.run('INSERT OR REPLACE INTO translation_cache (word, translation) VALUES (?, ?)', [clean, translation]);
        return translation;
    }, []);
    return { lookup, translate };
}
