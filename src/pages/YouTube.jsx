import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useProgressStore } from '../store/progressStore';
const YOUTUBE_CHANNELS = [
    { id: 'UCk-CP63XMk897PXXEhBizhw', name: 'BBC Learning English' },
    { id: 'UCwBnK6czOqJklP7QKXD6Q7g', name: 'VOA Learning English' },
    { id: 'UCsT0YIqwnpDLQM9kUhBflBw', name: 'TED' },
    { id: 'UCq-Ci6GMl1MBJCR3h1Ne4Aw', name: 'English with Lucy' },
    { id: 'UCJ6qMvjwEXhjoSNEV1jpfJA', name: 'mmmEnglish' },
    { id: 'UCvI5nZFolLpXpFPA3gAGUQg', name: 'English Addict with Mr Steve' },
];
const LEVELS = {
    'BBC Learning English': ['B1', 'B2'],
    'VOA Learning English': ['A2', 'B1'],
    'TED': ['B2', 'C1', 'C2'],
    'English with Lucy': ['B1', 'B2', 'C1'],
    'mmmEnglish': ['B1', 'B2'],
    'English Addict with Mr Steve': ['B1', 'B2'],
};
export default function YouTube() {
    const { setTodayXP } = useProgressStore();
    const [channelId, setChannelId] = useState('');
    const [episodes, setEpisodes] = useState([]);
    const [channelGroups, setChannelGroups] = useState([]);
    const [selectedEpisode, setSelectedEpisode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [allLoaded, setAllLoaded] = useState(false);
    const loadChannel = useCallback(async (id) => {
        setLoading(true);
        try {
            const data = await window.api.content.fetchYouTubeChannel(id);
            setEpisodes(data);
        }
        catch {
            setEpisodes([]);
        }
        setLoading(false);
    }, []);
    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const data = await window.api.content.fetchYouTubeRSS();
            setChannelGroups(data);
            setAllLoaded(true);
        }
        catch {
            setChannelGroups([]);
        }
        setLoading(false);
    }, []);
    useEffect(() => {
        if (!channelId)
            loadAll();
    }, [channelId, loadAll]);
    useEffect(() => {
        if (channelId)
            loadChannel(channelId);
    }, [channelId, loadChannel]);
    const handleSaveEpisode = async (ep) => {
        try {
            await window.api.content.saveYouTubeEpisode({
                videoId: ep.videoId,
                title: ep.title,
                channel: ep.channel,
                publishedAt: ep.publishedAt,
                level: LEVELS[ep.channel]?.[0] || 'B1',
            });
        }
        catch { /* ignore */ }
    };
    const handlePlay = (ep) => {
        setSelectedEpisode(ep);
        setTodayXP(5);
    };
    return (<div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">YouTube</h2>
          <p className="text-gray-400 text-sm mt-1">English learning videos from top channels</p>
        </div>
        {!allLoaded && (<button onClick={loadAll} className="btn-primary px-4 py-2 text-sm">
            Load All Channels
          </button>)}
      </div>

      {/* Channel selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setChannelId('')} className={`px-3 py-1.5 rounded text-sm font-medium ${!channelId ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
          All Channels
        </button>
        {YOUTUBE_CHANNELS.map(ch => (<button key={ch.id} onClick={() => setChannelId(ch.id)} className={`px-3 py-1.5 rounded text-sm font-medium ${channelId === ch.id ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {ch.name}
          </button>))}
      </div>

      {/* Player */}
      {selectedEpisode && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-white font-semibold">{selectedEpisode.title}</h3>
              <p className="text-gray-500 text-xs">{selectedEpisode.channel}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSaveEpisode(selectedEpisode)} className="btn-secondary px-3 py-1.5 text-xs">
                💾 Save
              </button>
              <button onClick={() => setSelectedEpisode(null)} className="text-gray-500 hover:text-white px-2">
                ✕
              </button>
            </div>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe src={`https://www.youtube.com/embed/${selectedEpisode.videoId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
          </div>
        </motion.div>)}

      {/* Episode grid */}
      {loading ? (<div className="card flex items-center justify-center h-48 text-gray-500">Loading episodes…</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(channelId ? episodes : channelGroups.flatMap(g => g.episodes.map(e => ({ ...e, channel: g.channel }))))
                .slice(0, 24)
                .map((ep, i) => (<motion.button key={`${ep.videoId}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => handlePlay(ep)} className="card text-left hover:border-brand-500 transition-colors">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 mb-3 relative">
                  <img src={`https://img.youtube.com/vi/${ep.videoId}/mqdefault.jpg`} alt={ep.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }}/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">▶️</span>
                  </div>
                </div>
                <h4 className="text-white text-sm font-semibold line-clamp-2 mb-1">{ep.title}</h4>
                <p className="text-gray-500 text-xs">{ep.channel} · {new Date(ep.publishedAt).toLocaleDateString()}</p>
              </motion.button>))}
        </div>)}
    </div>);
}
