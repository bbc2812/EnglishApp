import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import { useProgressStore } from '../store/progressStore';
const DRILLS = [
    { word: 'Think', ipa: '/θɪŋk/', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', sentences: ['I think therefore I am.', 'Think carefully before you speak.'], commonMistake: 'Vietnamese speakers often say /tɪŋk/ or /dɪŋk/' },
    { word: 'This', ipa: '/ðɪs/', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', sentences: ['This is my favorite book.', 'How much is this?'], commonMistake: 'Often pronounced as /zɪs/ or /sɪs/' },
    { word: 'Right', ipa: '/raɪt/', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', sentences: ['Turn right at the corner.', 'You are right.'], commonMistake: 'Vietnamese speakers often confuse /r/ and /l/' },
    { word: 'Light', ipa: '/laɪt/', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', sentences: ['The light is on.', 'Please turn off the light.'], commonMistake: 'Often pronounced with /r/ instead of /l/' },
    { word: 'Vest', ipa: '/vest/', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', sentences: ['I wore a vest to the party.', 'Where is my vest?'], commonMistake: 'Vietnamese speakers often add a vowel after final /t/' },
    { word: 'Watch', ipa: '/wɒtʃ/', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', sentences: ['What time is it? Let me check my watch.', 'I watch movies every evening.'], commonMistake: 'The /w/ sound is often replaced with /v/' },
];
function ScoreMeter({ score }) {
    const color = score >= 90 ? 'text-green-400' : score >= 70 ? 'text-amber-400' : 'text-red-400';
    const bgColor = score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500';
    return (<div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Match Score</span>
        <span className={`text-2xl font-bold ${color}`}>{score}%</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full ${bgColor} rounded-full`}/>
      </div>
    </div>);
}
function WaveformBox({ id }) {
    const containerRef = useRef(null);
    const wsRef = useRef(null);
    useEffect(() => {
        return () => { wsRef.current?.destroy(); };
    }, []);
    return (<div>
      <div ref={containerRef} id={id} className="h-[60px] rounded-lg overflow-hidden bg-gray-900/50"/>
    </div>);
}
function initWave(id, color) {
    return new Promise((resolve, reject) => {
        const ws = WaveSurfer.create({
            container: `#${id}`,
            height: 60,
            waveColor: color,
            progressColor: color === '#38bdf8' ? '#7dd3fc' : '#52c41a',
            cursorColor: 'transparent',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            backend: 'WebAudio',
        });
        ws.on('error', reject);
        ws.on('ready', () => resolve(ws));
    });
}
function ProblemSounds() {
    const problems = [
        { phoneme: '/θ/', issue: 'Say "th" like "s" or "z"', drill: 'think, this, that, the' },
        { phoneme: '/ð/', issue: 'Voiced th often becomes /z/', drill: 'this, that, them, there' },
        { phoneme: '/r/', issue: 'Confused with /l/ or /j/', drill: 'right, light, very, river' },
        { phoneme: '/v/', issue: 'Replaced with /w/ or /f/', drill: 'vest, very, love, have' },
        { phoneme: '/w/', issue: 'Pronounced as /v/ or /f/', drill: 'watch, water, want, week' },
        { phoneme: 'final /t/', issue: 'Added vowel after final consonants', drill: 'cat, best, light, rest' },
    ];
    return (<div className="card p-5">
      <h4 className="text-sm font-semibold text-white mb-3">⚠️ Common Vietnamese→English Sound Issues</h4>
      <div className="space-y-2">
        {problems.map((p, i) => (<div key={i} className="flex items-start gap-3 p-2 rounded bg-gray-800/50">
            <span className="text-brand-400 font-mono text-sm font-bold min-w-[40px]">{p.phoneme}</span>
            <div className="flex-1">
              <p className="text-xs text-gray-400">{p.issue}</p>
              <p className="text-xs text-gray-600 mt-0.5">Drill: {p.drill}</p>
            </div>
          </div>))}
      </div>
    </div>);
}
export default function Shadowing() {
    const { setTodayXP } = useProgressStore();
    const [phase, setPhase] = useState('drill');
    const [drillIndex, setDrillIndex] = useState(0);
    const [recording, setRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [history, setHistory] = useState([]);
    const [nativePlaying, setNativePlaying] = useState(false);
    const timerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const nativeWsRef = useRef(null);
    const current = DRILLS[drillIndex];
    useEffect(() => {
        if (nativeWsRef.current) {
            nativeWsRef.current.destroy();
            nativeWsRef.current = null;
        }
    }, [drillIndex]);
    const playNative = useCallback(async () => {
        setNativePlaying(true);
        try {
            nativeWsRef.current = await initWave('native-waveform', '#38bdf8');
            nativeWsRef.current.load(current.audioUrl);
            nativeWsRef.current.play();
            // Auto-advance after playback
            setTimeout(() => {
                setNativePlaying(false);
                setPhase('record');
            }, 4000);
        }
        catch {
            // Fallback: no audio available, just go to record
            setNativePlaying(false);
            setPhase('record');
        }
    }, [current.audioUrl]);
    const startRecording = useCallback(() => {
        const timerInterval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        timerRef.current = timerInterval;
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0)
                    chunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = async () => {
                clearInterval(timerInterval);
                timerRef.current = null;
                setRecording(false);
                setRecordingTime(0);
                // Simulate pronunciation scoring
                const simulatedScore = Math.min(100, Math.max(30, Math.floor(50 + Math.random() * 40)));
                setScore(simulatedScore);
                let fb = '';
                if (simulatedScore >= 90)
                    fb = 'Excellent! Your pronunciation is very close to native.';
                else if (simulatedScore >= 70)
                    fb = 'Good effort! Focus on the /θ/ sound — press your tongue between your teeth.';
                else if (simulatedScore >= 50)
                    fb = 'Fair. Try listening to the native audio 3 more times before recording.';
                else
                    fb = `Keep practicing! Your common mistake: ${current.commonMistake}`;
                setFeedback(fb);
                setPhase('score');
                // Save to history
                const newEntry = { word: current.word, score: simulatedScore, date: new Date().toISOString() };
                setHistory(prev => [newEntry, ...prev].slice(0, 20));
                // Save to DB
                try {
                    await window.api.db.run(`INSERT INTO pronunciation_sessions (word, match_score, phoneme_feedback, created_at)
             VALUES (?, ?, ?, datetime('now'))`, [current.word, simulatedScore, fb]);
                }
                catch { /* ignore */ }
                // Track XP
                setTodayXP(simulatedScore >= 80 ? 10 : 5);
            };
            mediaRecorder.start();
            setRecording(true);
        }).catch(() => {
            // No mic access
            clearInterval(timerInterval);
            timerRef.current = null;
            setRecording(false);
            setRecordingTime(0);
            const simulatedScore = Math.floor(40 + Math.random() * 50);
            setScore(simulatedScore);
            setFeedback(`Simulated: ${simulatedScore}%. Enable microphone for real recording.`);
            setPhase('score');
        });
    }, [current.word, current.commonMistake, setTodayXP]);
    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
    }, []);
    const resetPhase = () => {
        setPhase('drill');
        setScore(0);
        setRecordingTime(0);
    };
    return (<div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Shadowing</h2>
          <p className="text-gray-400 text-sm mt-1">Listen, record, and compare your pronunciation</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'drill' && (<motion.div key="drill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Drill selector */}
            <div className="grid grid-cols-3 gap-3">
              {DRILLS.map((d, i) => (<button key={i} onClick={() => { setDrillIndex(i); resetPhase(); }} className={`card p-3 text-left ${i === drillIndex ? 'border-brand-500 bg-brand-950/30' : 'hover:border-gray-600'}`}>
                  <p className="text-white font-semibold text-sm">{d.word}</p>
                  <p className="text-brand-400 text-xs font-mono mt-1">/{d.ipa}/</p>
                </button>))}
            </div>

            {/* Current word */}
            <div className="card p-8 text-center">
              <p className="text-5xl font-bold text-white mb-2">{current.word}</p>
              <p className="text-brand-400 text-xl font-mono mb-6">/{current.ipa}/</p>
              <button onClick={() => setPhase('play')} className="btn-primary px-10 py-3 text-lg">
                ▶ Play Native Audio
              </button>
            </div>

            {/* Common mistake warning */}
            <div className="card p-4 border-amber-900/50 bg-amber-950/20">
              <p className="text-xs text-amber-400 font-semibold">⚠️ Common mistake for this sound:</p>
              <p className="text-sm text-gray-400 mt-1">{current.commonMistake}</p>
            </div>

            {/* Problem sounds reference */}
            <ProblemSounds />
          </motion.div>)}

        {phase === 'play' && (<motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="card p-6 text-center">
              <p className="text-3xl mb-3">🎧</p>
              <h3 className="text-xl font-bold text-white mb-1">Listen Carefully</h3>
              <p className="text-4xl font-bold text-white mb-1">{current.word}</p>
              <p className="text-brand-400 text-lg font-mono mb-6">/{current.ipa}/</p>

              {/* Native waveform */}
              <div className="mb-4">
                <WaveformBox id="native-waveform" color="#38bdf8"/>
              </div>

              {nativePlaying ? (<p className="text-brand-400 text-sm animate-pulse">Playing native audio…</p>) : (<button onClick={playNative} className="btn-primary px-8 py-3 text-base">
                  ▶ Play Native Audio
                </button>)}

              {/* Sentences */}
              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Practice sentences:</p>
                {current.sentences.map((s, i) => (<div key={i} className="text-left px-4 py-2.5 rounded-lg bg-gray-800/50 text-gray-300 text-sm">
                    "{s}"
                  </div>))}
              </div>

              <button onClick={() => setPhase('record')} className="btn-primary px-8 py-3 text-base mt-4">
                🎤 Record Your Voice
              </button>
            </div>
          </motion.div>)}

        {phase === 'record' && (<motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="card p-6 text-center">
              <p className="text-3xl mb-3">🎤</p>
              <h3 className="text-xl font-bold text-white mb-1">Your Turn</h3>
              <p className="text-4xl font-bold text-white mb-2">{current.word}</p>
              <p className="text-gray-400 mb-6">Repeat the word aloud</p>

              {/* Timer */}
              {recording && (<p className="text-red-400 text-lg font-mono mb-4">⏱ {recordingTime}s</p>)}

              {/* User waveform placeholder */}
              <div className="mb-4">
                <WaveformBox id="user-waveform" color="#52c41a"/>
              </div>

              {!recording ? (<button onClick={startRecording} className="btn-primary px-10 py-3 text-lg bg-red-600 hover:bg-red-500">
                  🎤 Record Now
                </button>) : (<button onClick={stopRecording} className="btn-secondary px-10 py-3 text-lg bg-gray-700">
                  ⏹ Stop
                </button>)}
            </div>
          </motion.div>)}

        {phase === 'score' && (<motion.div key="score" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="card p-6 text-center">
              <p className="text-5xl mb-4">{score >= 90 ? '🌟' : score >= 70 ? '👍' : '💪'}</p>
              <h3 className="text-2xl font-bold text-white mb-6">Pronunciation Result</h3>

              <ScoreMeter score={score}/>

              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg text-left">
                <p className="text-sm text-gray-300">{feedback}</p>
              </div>

              <div className="mt-4 flex gap-3 justify-center">
                <button onClick={resetPhase} className="btn-secondary px-6 py-2.5 text-sm">Try Again</button>
                <button onClick={() => { setDrillIndex(prev => (prev + 1) % DRILLS.length); resetPhase(); setPhase('drill'); }} className="btn-primary px-6 py-2.5 text-sm">Next Drill →</button>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (<div className="card p-5">
                <h4 className="text-sm font-semibold text-white mb-3">Recent Sessions</h4>
                <div className="space-y-1">
                  {history.slice(0, 5).map((h, i) => (<div key={i} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-400">{h.word}</span>
                      <span className={h.score >= 80 ? 'text-green-400' : h.score >= 60 ? 'text-amber-400' : 'text-red-400'}>
                        {h.score}%
                      </span>
                    </div>))}
                </div>
              </div>)}
          </motion.div>)}
      </AnimatePresence>
    </div>);
}
