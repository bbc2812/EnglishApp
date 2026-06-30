import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProgressStore } from '../store/progressStore'

type Phase = 'prompt' | 'speaking' | 'review'

interface SpeakingPrompt {
  id: number
  category: 'debate' | 'opinion' | 'description' | 'roleplay'
  question: string
  context: string
  vocabHints: string[]
  sampleStart: string
  difficulty: string
}

const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  {
    id: 1, category: 'debate',
    question: 'Should AI replace teachers in classrooms?',
    context: 'Imagine you are in a debate about technology in education. One side argues AI makes learning more personalized and efficient. The other argues human teachers are irreplaceable.',
    vocabHints: ['personalized', 'efficiency', 'irreplaceable', 'facilitate', 'autonomy'],
    sampleStart: 'I firmly believe that while AI can enhance education, human teachers remain essential because...',
    difficulty: 'C1'
  },
  {
    id: 2, category: 'opinion',
    question: 'What is the single most important skill for the 21st century?',
    context: 'You are being interviewed by a magazine editor. They want your candid opinion on what skill matters most.',
    vocabHints: ['adaptability', 'critical thinking', 'digital literacy', 'emotional intelligence', 'resilience'],
    sampleStart: 'If I had to pick one skill, I would say it\'s adaptability because in a world where technology evolves every day...',
    difficulty: 'B2'
  },
  {
    id: 3, category: 'description',
    question: 'Describe a moment when you overcame a significant challenge.',
    context: 'This is a common interview question. Use the STAR method: Situation, Task, Action, Result.',
    vocabHints: ['overcame', 'perseverance', 'obstacle', 'turning point', 'accomplishment'],
    sampleStart: 'The most significant challenge I faced was when I had to...',
    difficulty: 'B2'
  },
  {
    id: 4, category: 'roleplay',
    question: 'You are complaining about a defective product at a store.',
    context: 'You bought a laptop last week and it stopped working after 3 days. You want a full refund. Be polite but firm.',
    vocabHints: ['defective', 'refund', 'warranty', 'inconvenience', 'resolution'],
    sampleStart: 'Good afternoon. I\'d like to speak with the manager about a product I purchased...',
    difficulty: 'B1'
  },
  {
    id: 5, category: 'debate',
    question: 'Is remote work better than office work?',
    context: 'A company is deciding whether to adopt a hybrid model. Present your argument with supporting evidence.',
    vocabHints: ['productivity', 'commute', 'work-life balance', 'collaboration', 'overhead'],
    sampleStart: 'While remote work offers undeniable benefits such as flexibility and reduced commuting, I believe that a hybrid approach...',
    difficulty: 'C1'
  },
  {
    id: 6, category: 'opinion',
    question: 'Should university education be free for everyone?',
    context: 'You are participating in a town hall meeting. Give your perspective on government-funded education.',
    vocabHints: ['accessible', 'investment', 'burden', 'opportunity', 'subsidize'],
    sampleStart: 'I think the question isn\'t whether university should be free, but rather...',
    difficulty: 'C1'
  }
]

function DifficultyBadge({ level }: { level: string }): JSX.Element {
  const colors: Record<string, string> = {
    B1: 'bg-blue-900/40 text-blue-300',
    B2: 'bg-cyan-900/40 text-cyan-300',
    C1: 'bg-purple-900/40 text-purple-300',
    C2: 'bg-orange-900/40 text-orange-300',
  }
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors[level] || 'bg-gray-700 text-gray-300'}`}>
      {level}
    </span>
  )
}

function SpeakingPromptCard({ prompt, onSelect }: { prompt: SpeakingPrompt; onSelect: (p: SpeakingPrompt) => void }): JSX.Element {
  const categoryIcons: Record<string, string> = {
    debate: '🗣️',
    opinion: '💭',
    description: '📝',
    roleplay: '🎭'
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(prompt)}
      className="card text-left p-5 hover:border-brand-500 transition-colors block w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{categoryIcons[prompt.category]}</span>
        <DifficultyBadge level={prompt.difficulty} />
      </div>
      <h4 className="text-white font-semibold text-sm mb-1">{prompt.question}</h4>
      <p className="text-gray-500 text-xs line-clamp-2">{prompt.context}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {prompt.vocabHints.slice(0, 3).map((v, i) => (
          <span key={i} className="text-xs text-brand-400 bg-brand-950/30 px-1.5 py-0.5 rounded">
            {v}
          </span>
        ))}
      </div>
    </motion.button>
  )
}

function SpeakingTimer({ running, timeLeft, onToggle }: {
  running: boolean
  timeLeft: number
  onToggle: () => void
}): JSX.Element {
  const m = Math.floor(timeLeft / 60)
  const s = timeLeft % 60

  return (
    <div className="flex items-center gap-3">
      <div className={`text-2xl font-mono ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
        {m}:{s.toString().padStart(2, '0')}
      </div>
      <button
        onClick={onToggle}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          running ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
      >
        {running ? '⏸ Pause' : '▶ Start'}
      </button>
    </div>
  )
}

function SpeakingFeedback({ score, tips }: { score: number; tips: string[] }): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-4xl font-bold text-white mb-1">{score}/100</p>
        <p className="text-sm text-gray-400">Fluency & Coherence Score</p>
        <p className="text-xs text-brand-400 mt-1">+10 XP earned</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white">💡 Tips for Improvement</h4>
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-brand-400 mt-0.5">→</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <div className="card p-4 bg-brand-950/10 border-brand-900/30">
        <p className="text-sm text-gray-300 italic">
          "The key to improving your speaking is consistent practice. Try to speak English for at least 15 minutes every day, even if just to yourself."
        </p>
      </div>
    </div>
  )
}

export default function Speaking(): JSX.Element {
  const { setTodayXP } = useProgressStore()
  const [phase, setPhase] = useState<Phase>('prompt')
  const [selectedPrompt, setSelectedPrompt] = useState<SpeakingPrompt | null>(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const [running, setRunning] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [tips, setTips] = useState<string[]>([])
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (running && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0) {
      setRunning(false)
    }
    return () => interval && clearInterval(interval)
  }, [running, timeLeft])

  const handleSelectPrompt = useCallback((prompt: SpeakingPrompt) => {
    setSelectedPrompt(prompt)
    setTimeLeft(60)
    setRunning(false)
    setTranscript('')
    setPhase('speaking')
  }, [])

  const handleStartSpeaking = useCallback(() => {
    setRunning(true)
  }, [])

  const handleEndSpeaking = useCallback(() => {
    setRunning(false)
    // Simulate speech-to-text and scoring
    const fakeTranscript = `I believe that ${selectedPrompt?.question.toLowerCase().replace('?', '')}. In my experience, this is an important topic because many people have different opinions. Some argue that technology is making our lives easier, while others think it creates new problems. I personally think that the benefits outweigh the drawbacks, as long as we use it responsibly. The key is to find a balance between tradition and innovation.`

    setTranscript(fakeTranscript)
    setWordCount(fakeTranscript.split(/\s+/).length)

    const fakeScore = Math.min(100, Math.max(40, 60 + Math.floor(Math.random() * 35)))
    setScore(fakeScore)

    const fakeTips: string[] = [
      'Use more varied sentence structures (conditionals, relative clauses)',
      'Try to incorporate some C1-level vocabulary like "nevertheless" or "conversely"',
      'Pause briefly between ideas instead of using filler words like "um"',
      'Practice using the STAR method for descriptive questions',
      'Record yourself and compare with native speakers',
    ]
    setTips(fakeTips.slice(0, 3))

    // Save XP
    setTodayXP(10)
    setPhase('review')
  }, [selectedPrompt, setTodayXP])

  return (
    <div className="p-8 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Speaking</h2>
          <p className="text-gray-400 text-sm mt-1">Debate, opinion, and role-play practice</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'prompt' && (
          <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {SPEAKING_PROMPTS.map((p) => (
                <SpeakingPromptCard key={p.id} prompt={p} onSelect={handleSelectPrompt} />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'speaking' && selectedPrompt && (
          <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Prompt Card */}
            <div className="card p-6 border-brand-900/50">
              <div className="flex items-center justify-between mb-3">
                <DifficultyBadge level={selectedPrompt.difficulty} />
                <SpeakingTimer running={running} timeLeft={timeLeft} onToggle={() => {
                  if (running) handleEndSpeaking()
                  else setRunning(true)
                }} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{selectedPrompt.question}</h3>
              <p className="text-gray-400 text-sm mb-4">{selectedPrompt.context}</p>

              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Vocabulary to Use:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPrompt.vocabHints.map((v, idx) => (
                    <span key={idx} className="text-sm bg-brand-950/30 text-brand-300 px-2 py-0.5 rounded">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">💡 Suggested Opening:</p>
                <p className="text-sm text-gray-300 italic">{selectedPrompt.sampleStart}</p>
              </div>

              {/* Transcript preview */}
              {transcript && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">📝 Your Speech:</p>
                  <p className="text-sm text-gray-300 selectable">{transcript}</p>
                  <p className="text-xs text-gray-600 mt-1">{wordCount} words</p>
                </div>
              )}
            </div>

            {/* Speaking controls */}
            <div className="card p-5 text-center">
              <p className="text-5xl mb-4">{running ? '🎤' : '🗣️'}</p>
              <h3 className="text-xl font-bold text-white mb-2">
                {running ? 'You are speaking...' : 'Ready to speak?'}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {running
                  ? `Keep talking! ${timeLeft}s remaining. Click below when done.`
                  : 'Click Start and speak for 60 seconds. Try to use the vocabulary hints.'
                }
              </p>
              {!running && (
                <button onClick={handleStartSpeaking} className="btn-primary px-8 py-3 text-base">
                  ▶ Start Speaking
                </button>
              )}
              {running && timeLeft > 0 && (
                <button onClick={handleEndSpeaking} className="btn-secondary px-8 py-3 text-base">
                  ⏹ Stop & Review
                </button>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'review' && (
          <motion.div key="review" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="card p-8">
              <div className="flex items-center justify-center mb-6">
                <p className="text-5xl">{score >= 80 ? '🌟' : score >= 60 ? '👍' : '💪'}</p>
              </div>

              <SpeakingFeedback score={score} tips={tips} />

              {selectedPrompt && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-sm font-semibold text-white mb-2">Prompt: {selectedPrompt.question}</h4>
                  <p className="text-sm text-gray-300 selectable">{transcript}</p>
                </div>
              )}

              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setPhase('prompt')
                    setSelectedPrompt(null)
                    setTranscript('')
                    setScore(0)
                  }}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  Try Another Prompt
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
