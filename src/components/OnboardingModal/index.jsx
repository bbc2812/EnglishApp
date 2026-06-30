import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';
const STEPS = [
    {
        id: 1,
        title: 'Welcome to WiseRain 🌧️',
        description: 'Your personal English learning companion to reach C1/C2 fluency. We\'ll set up your profile in 3 quick steps.'
    },
    {
        id: 2,
        title: 'What\'s your current level? 📊',
        description: 'Be honest — this helps us place you in the right units.'
    },
    {
        id: 3,
        title: 'Choose your AI tutor 🤖',
        description: 'We support Claude, Gemini, and Ollama (local). You can always change this later.'
    }
];
export default function OnboardingModal() {
    const { claudeApiKey, geminiApiKey, ollamaUrl, ollamaModel, activeProvider, setActiveProvider, setDailyNewWords, setBilingualGrammar, setOnboardingComplete, } = useSettingsStore();
    const [step, setStep] = useState(0);
    const [level, setLevel] = useState('B1');
    const [name, setName] = useState('Learner');
    const [dailyWords, setDailyWords] = useState(20);
    const [bilingual, setBilingual] = useState(true);
    const handleFinish = () => {
        setDailyNewWords(dailyWords);
        setBilingualGrammar(bilingual);
        setOnboardingComplete(true);
    };
    if (step < STEPS.length) {
        const current = STEPS[step];
        if (step === 0) {
            return (<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg mx-4">
            <p className="text-5xl mb-4">🌧️</p>
            <h2 className="text-2xl font-bold text-white mb-3">{current.title}</h2>
            <p className="text-gray-400 mb-6">{current.description}</p>
            <div className="flex justify-end">
              <button onClick={() => setStep(1)} className="btn-primary px-6 py-2.5">
                Let's Go →
              </button>
            </div>
          </motion.div>
        </div>);
        }
        if (step === 1) {
            return (<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg mx-4">
            <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
            <p className="text-gray-400 text-sm mb-6">{current.description}</p>

            <div className="mb-4">
              <label className="text-sm text-gray-300 block mb-2">Your name (optional)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-brand-500 focus:outline-none"/>
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-300 block mb-2">Your current level</label>
              <div className="grid grid-cols-4 gap-2">
                {['A2', 'B1', 'B2', 'C1'].map(l => (<button key={l} onClick={() => setLevel(l)} className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${level === l ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {l}
                  </button>))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-300 block mb-2">Daily new words goal</label>
              <div className="flex items-center gap-3">
                <input type="range" min="5" max="50" value={dailyWords} onChange={e => setDailyWords(Number(e.target.value))} className="flex-1 accent-brand-500"/>
                <span className="text-white font-bold min-w-[3ch] text-right">{dailyWords}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="text-gray-500 hover:text-gray-300 text-sm">
                ← Back
              </button>
              <button onClick={() => setStep(2)} className="btn-primary px-6 py-2.5">
                Next →
              </button>
            </div>
          </motion.div>
        </div>);
        }
        if (step === 2) {
            return (<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg mx-4">
            <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
            <p className="text-gray-400 text-sm mb-6">{current.description}</p>

            <div className="mb-4">
              <label className="text-sm text-gray-300 block mb-2">AI Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {['claude', 'gemini', 'ollama'].map(p => (<button key={p} onClick={() => setActiveProvider(p)} className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${activeProvider === p ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {p === 'claude' ? '🟣 Claude' : p === 'gemini' ? '🟡 Gemini' : '🤖 Ollama'}
                  </button>))}
              </div>
            </div>

            {activeProvider === 'ollama' && (<div className="mb-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ollama URL</label>
                  <input type="text" value={ollamaUrl} onChange={e => useSettingsStore.getState().setOllamaUrl(e.target.value)} placeholder="http://localhost:11434" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ollama Model</label>
                  <input type="text" value={ollamaModel} onChange={e => useSettingsStore.getState().setOllamaModel(e.target.value)} placeholder="llama3.2" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"/>
                </div>
              </div>)}

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={bilingual} onChange={e => setBilingual(e.target.checked)} className="accent-brand-500"/>
                <span className="text-sm text-gray-300">Show grammar explanations in Vietnamese</span>
              </label>
            </div>

            {(activeProvider === 'claude' && !claudeApiKey) ||
                    (activeProvider === 'gemini' && !geminiApiKey) ? (<div className="mb-6 p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg">
                <p className="text-xs text-amber-400">⚠️ API key required. Set it in Settings after completing onboarding.</p>
              </div>) : null}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-300 text-sm">
                ← Back
              </button>
              <button onClick={handleFinish} className="btn-primary px-6 py-2.5">
                🚀 Start Learning
              </button>
            </div>
          </motion.div>
        </div>);
        }
    }
    return null;
}
