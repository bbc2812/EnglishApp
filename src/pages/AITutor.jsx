import { useEffect, useState, useRef, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
const PROVIDER_LIST = ['claude', 'ollama', 'gemini'];
const SYSTEM_PROMPT = `You are an expert English tutor for a Vietnamese speaker at B1/B2 level aiming for C1/C2.
Correct grammar mistakes inline using [correction] format. Explain WHY it matters.
For vocabulary: give definition, IPA, 3 examples, collocations, Vietnamese false friends.
For grammar rules: explain in BOTH English and Vietnamese (song ngữ).
Highlight common Vietnamese→English traps: missing articles, wrong tense, SVO word order errors.
Be concise, specific, and encouraging.`;
function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    // Parse [correction] format
    const renderContent = (text) => {
        const parts = text.split(/\[([^\]]+)\]/g);
        return parts.map((part, i) => {
            if (i % 2 === 1)
                return <mark key={i} className="bg-brand-950/50 text-brand-300 px-1 rounded">{part}</mark>;
            return <span key={i}>{part}</span>;
        });
    };
    return (<div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${isUser
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-200 rounded-bl-sm'}`}>
        <p className="text-sm leading-relaxed selectable">{renderContent(message.content)}</p>
      </div>
    </div>);
}
function ProviderBadge({ provider }) {
    const icons = {
        claude: '🟣',
        ollama: '🤖',
        gemini: '🟡',
    };
    return (<span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
      {icons[provider] || '🤖'} {provider}
    </span>);
}
export default function AITutor() {
    const { claudeApiKey, ollamaUrl, ollamaModel, geminiApiKey, activeProvider, setActiveProvider } = useSettingsStore();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [available, setAvailable] = useState({});
    const messagesEndRef = useRef(null);
    const loadConversation = useCallback(async () => {
        const rows = await window.api.db.all(`SELECT * FROM conversations ORDER BY created_at ASC LIMIT 50`);
        setMessages(rows);
    }, []);
    useEffect(() => {
        loadConversation();
    }, [loadConversation]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const checkProvider = async (provider) => {
        const isAvail = await window.api.ai.isAvailable(provider, provider === 'ollama' ? { ollamaUrl } : {});
        setAvailable(prev => ({ ...prev, [provider]: isAvail }));
    };
    useEffect(() => {
        checkProvider('claude');
        checkProvider('ollama');
    }, []);
    const sendMessage = async () => {
        if (!input.trim() || loading)
            return;
        setLoading(true);
        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: input.trim(),
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        try {
            const provider = activeProvider;
            const response = await window.api.ai.chat(provider, [...messages, userMsg].map(m => ({ role: m.role, content: m.content })), SYSTEM_PROMPT, provider === 'claude'
                ? { apiKey: claudeApiKey }
                : provider === 'gemini'
                    ? { geminiApiKey }
                    : { ollamaUrl, ollamaModel });
            const assistantMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMsg]);
            // Save to DB
            try {
                await window.api.db.run(`INSERT INTO conversations (type, provider, messages, created_at)
           VALUES ('tutor', ?, ?, datetime('now'))`, [provider, JSON.stringify([...messages, userMsg, assistantMsg])]);
            }
            catch { /* ignore */ }
        }
        catch (err) {
            const errorMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `⚠️ Error: ${err instanceof Error ? err.message : 'Failed to get response'}`,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMsg]);
        }
        setLoading(false);
    };
    const quickPrompts = [
        'Correct my grammar: "I go to school yesterday"',
        'What does "resilient" mean? Give examples',
        'Explain the difference between "make" and "do"',
        'How do I say "đồng ý" in English correctly?',
    ];
    return (<div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white">🤖 AI Tutor</h2>
          <div className="flex gap-1 bg-gray-900 p-1 rounded-lg">
            {PROVIDER_LIST.map(p => (<button key={p} onClick={() => setActiveProvider(p)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeProvider === p ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {p === 'claude' ? '🟣 Claude' : p === 'gemini' ? '🟡 Gemini' : '🤖 Ollama'}
              </button>))}
          </div>
        </div>
        <div className="flex gap-2">
          <ProviderBadge provider={activeProvider}/>
          {available[activeProvider] === false && (<span className="text-xs text-amber-400">⚠️ Not available</span>)}
          {activeProvider === 'claude' && !claudeApiKey && (<span className="text-xs text-red-400">⚠️ No API key</span>)}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-5xl mb-4">🤖</p>
            <h3 className="text-xl font-bold text-white mb-2">AI Tutor</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md">
              Ask me anything about English grammar, vocabulary, or pronunciation.
              I'll explain in both English and Vietnamese.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg">
              {quickPrompts.map((p, i) => (<button key={i} onClick={() => setInput(p)} className="text-left text-xs text-gray-400 bg-gray-800/50 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors">
                  "{p}"
                </button>))}
            </div>
          </div>) : (<div>
            {messages.map(msg => (<MessageBubble key={msg.id} message={msg}/>))}
            {loading && (<div className="flex justify-start mb-4">
                <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                  </div>
                </div>
              </div>)}
            <div ref={messagesEndRef}/>
          </div>)}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Ask about English grammar, vocabulary, or pronunciation..." disabled={loading} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-500 focus:outline-none disabled:opacity-50"/>
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-primary px-6 py-3 text-sm disabled:opacity-40">
            Send
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Bilingual mode on by default · AI explains grammar in English + Vietnamese
        </p>
      </div>
    </div>);
}
