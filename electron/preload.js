import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
const api = {
    db: {
        query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
        run: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
        all: (sql, params) => ipcRenderer.invoke('db:all', sql, params)
    },
    ai: {
        chat: (provider, messages, system, options) => ipcRenderer.invoke('ai:chat', provider, messages, system, options),
        isAvailable: (provider, options) => ipcRenderer.invoke('ai:isAvailable', provider, options),
        adaptArticle: (text, level, options) => ipcRenderer.invoke('ai:adaptArticle', text, level, options),
        summarizeContent: (content, options) => ipcRenderer.invoke('ai:summarizeContent', content, options)
    },
    content: {
        fetchRss: (url) => ipcRenderer.invoke('content:fetchRss', url),
        fetchDictionary: (word) => ipcRenderer.invoke('content:fetchDictionary', word),
        fetchTranslation: (word) => ipcRenderer.invoke('content:fetchTranslation', word),
        fetchNewsAPI: (category, apiKey) => ipcRenderer.invoke('content:fetchNewsAPI', category, apiKey),
        fetchBBCLE: (filter) => ipcRenderer.invoke('content:fetchBBCLE', filter),
        fetchGuardianArticles: (topic, page) => ipcRenderer.invoke('content:fetchGuardianArticles', topic, page),
        fetchYouTubeRSS: (channelId) => ipcRenderer.invoke('content:fetchYouTubeRSS', channelId),
        fetchYouTubeChannel: (channelId) => ipcRenderer.invoke('content:fetchYouTubeChannel', channelId),
        fetchDatamuse: (query, relSyn) => ipcRenderer.invoke('content:fetchDatamuse', query, relSyn),
        fetchWiktionary: (word) => ipcRenderer.invoke('content:fetchWiktionary', word),
        fetchCambridge: (word) => ipcRenderer.invoke('content:fetchCambridge', word),
        fetchQuotable: (limit) => ipcRenderer.invoke('content:fetchQuotable', limit),
        fetchWordOfTheDay: () => ipcRenderer.invoke('content:fetchWordOfTheDay'),
        scrapeUrl: (url) => ipcRenderer.invoke('content:scrapeUrl', url),
        saveYouTubeEpisode: (data) => ipcRenderer.invoke('content:saveYouTubeEpisode', data)
    },
    clipboard: {
        capture: () => ipcRenderer.invoke('clipboard:capture'),
        onCapture: (callback) => {
            const handler = (_event, text) => callback(text);
            ipcRenderer.on('clipboard:capture', handler);
            return () => ipcRenderer.removeListener('clipboard:capture', handler);
        }
    }
};
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI);
        contextBridge.exposeInMainWorld('api', api);
    }
    catch (error) {
        console.error(error);
    }
}
else {
    // @ts-ignore (global fallback for non-isolated contexts)
    window.electron = electronAPI;
    // @ts-ignore
    window.api = api;
}
