import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShadowing, TranscriptionSentence } from '../../hooks/useShadowing'
import { useSettingsStore } from '../../store/settingsStore'
import { analyzeSentenceLevel } from '../../lib/advancedWords'

interface ShadowingPlayerProps {
  sentences: TranscriptionSentence[]
  episodeType: 'podcast' | 'youtube' | 'imported_article'
  episodeId: string
  audioUrl?: string
  onClose?: () => void
}

type ViewMode = 'learn' | 'free' | 'review'

function SentenceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'passed': return <span className="text-green-400 text-sm">✓</span>
    case 'attempting': return <span className="text-amber-400 text-sm">🔄</span>
    case 'failed': return <span className="text-red-400 text-sm">✗</span>
    default: return <span className="text-gray-600 text-sm">⏳</span>
  }
}

function WaveformVisualizer({ color, isActive }: { color: string; isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)

  const drawWave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    if (!isActive) {
      // Static flat line
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.strokeStyle = color + '40'
      ctx.lineWidth = 2
      ctx.stroke()
      return
    }

    // Animated waveform
    const time = Date.now() / 1000
    ctx.beginPath()

    for (let x = 0; x < width; x++) {
      const wave = Math.sin(x * 0.05 + time * 3) * Math.sin(x * 0.02 + time)
      const y = height / 2 + wave * (height / 2 - 4)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    animFrameRef.current = requestAnimationFrame(drawWave)
  }, [isActive, color])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full h-[60px] rounded-lg bg-gray-900/50"
    />
  )
}

function SpeedSelector({ speed, onChange }: { speed: number; onChange: (s: number) => void }) {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 mr-1">Speed:</span>
      {speeds.map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            speed === s ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          {s}x
        </button>
      ))}
    </div>
  )
}

function SubtitleToggle({ mode, onChange }: { mode: 'en' | 'vn' | 'both'; onChange: (m: 'en' | 'vn' | 'both') => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 mr-1">Subs:</span>
      {(['en', 'vn', 'both'] as const).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            mode === m ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          {m === 'both' ? 'EN+VN' : m.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function ProgressBars({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{completed}/{total} sentences</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completed / total) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-brand-500 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}

function AdvancedWordHighlight({ sentence, onWordClick }: { sentence: string; onWordClick: (word: string) => void }) {
  const analyzed = analyzeSentenceLevel(sentence)
  return (
    <span className="selectable">
      {analyzed.map((item, i) => {
        if (!item.level) {
          return (
            <span
              key={i}
              onClick={() => item.word && onWordClick(item.word.replace(/[^a-zA-Z'-]/g, ''))}
              className="cursor-pointer hover:text-brand-400 hover:bg-brand-950/30 px-0.5 rounded transition-colors inline"
            >
              {item.raw}{' '}
            </span>
          )
        }
        const isC2 = item.level === 'C2'
        return (
          <span
            key={i}
            onClick={() => item.word && onWordClick(item.word.replace(/[^a-zA-Z'-]/g, ''))}
            className={`cursor-pointer px-0.5 rounded transition-colors inline ${
              isC2
                ? 'text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 font-semibold'
                : 'text-amber-400 bg-amber-950/30 hover:bg-amber-900/50 font-medium'
            }`}
            title={isC2 ? 'C2-level word' : 'C1-level word'}
          >
            {item.raw}{' '}
          </span>
        )
      })}
    </span>
  )
}

export function ShadowingPlayer({ sentences, episodeType, episodeId, onClose }: ShadowingPlayerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('learn')
  const [subtitleMode, setSubtitleMode] = useState<'en' | 'vn' | 'both'>('both')
  const { shadowingScoring } = useSettingsStore()
  const {
    phase, currentIndex, recording, recordingTime, results, currentScore, currentFeedback,
    playingNative, loopCount, loopEnabled, loopMax, playbackSpeed,
    allPassed, completedCount, totalSentences, currentSentence,
    scoreColor, scoreBg, sentenceStatus,
    playNativeSentence, startRecording, stopRecording, nextSentence,
    retrySentence, toggleLoop, setLoopMax, setPlaybackSpeed,
    setCurrentIndex
  } = useShadowing(sentences)

  const handleWordClick = useCallback((word: string) => {
    // Text selection triggers DictionaryPopup automatically via mouseup handler
    const el = document.createElement('span')
    el.textContent = word
    document.body.appendChild(el)
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    document.body.removeChild(el)
  }, [])

  // Save episode ID to shadowing context
  const saveContext = useCallback(() => {
    window.api.shadowing.save({
      episodeType,
      episodeId,
      sentenceIndex: currentIndex,
      sentenceText: currentSentence.text,
      sentenceTranslation: currentSentence.translation,
      matchScore: currentScore ?? 0,
      phonemeFeedback: currentFeedback,
      attempts: 1,
      passed: (currentScore ?? 0) >= 80 ? 1 : 0,
      mode: viewMode === 'learn' ? 'learn' : 'free'
    }).catch(() => {})
  }, [episodeType, episodeId, currentIndex, currentSentence, currentScore, currentFeedback, viewMode])

  const handleNext = useCallback(() => {
    if (currentIndex < totalSentences - 1) {
      nextSentence()
    } else {
      saveContext()
      setViewMode('review')
    }
  }, [currentIndex, totalSentences, nextSentence, saveContext])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault()
      if (!playingNative && phase === 'idle') playNativeSentence()
    }
    if (e.code === 'KeyR' && !recording) startRecording()
    if (e.code === 'KeyR' && recording) stopRecording()
  }, [playingNative, phase, recording, playNativeSentence, startRecording, stopRecording])

  if (sentences.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-400">No transcript available for shadowing.</p>
        <p className="text-gray-600 text-sm mt-2">Try pasting a transcript manually.</p>
        {onClose && (
          <button onClick={onClose} className="btn-secondary px-6 py-2 mt-4">Go Back</button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      {/* View mode selector */}
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('learn')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'learn' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            📝 Learn Mode
          </button>
          <button
            onClick={() => setViewMode('free')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'free' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎧 Free Mode
          </button>
          {completedCount > 0 && (
            <button
              onClick={() => setViewMode('review')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'review' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              🔄 Review ({results.filter(r => r.matchScore < 80).length})
            </button>
          )}
        </div>

        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white px-2">✕</button>
        )}
      </div>

      {/* Settings row */}
      <div className="flex items-center gap-4 flex-wrap">
        <SpeedSelector speed={playbackSpeed} onChange={setPlaybackSpeed} />
        <SubtitleToggle mode={subtitleMode} onChange={setSubtitleMode} />
        {viewMode === 'learn' && (
          <div className="flex items-center gap-1">
            <button
              onClick={toggleLoop}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                loopEnabled ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              🔁 Loop {loopCount}/{loopMax}
            </button>
            <select
              value={loopMax}
              onChange={e => setLoopMax(Number(e.target.value))}
              className="text-xs bg-gray-800 text-gray-400 rounded px-1 py-0.5"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
          </div>
        )}
        <div className="text-xs text-gray-500">
          Scoring: <span className={shadowingScoring === 'ai' ? 'text-brand-400' : ''}>{shadowingScoring === 'ai' ? 'AI' : 'Simulated'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 border-l border-gray-700 pl-3">
          <span>Vocab:</span>
          <span className="text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded">C1</span>
          <span className="text-rose-400 bg-rose-950/30 px-1.5 py-0.5 rounded">C2</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'learn' && (
          <motion.div
            key="learn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Progress bar */}
            <ProgressBars completed={completedCount} total={totalSentences} />

            {/* Sentence index */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Sentence <span className="text-white font-semibold">{currentIndex + 1}</span> of {totalSentences}
              </span>
              {phase === 'done' && (
                <span className="text-sm text-green-400">🎉 All Complete!</span>
              )}
            </div>

            {/* Sentence card */}
            <div className="card p-6">
              {/* English sentence */}
              <div className="mb-4">
                <p className="text-xl text-white leading-relaxed">
                  <AdvancedWordHighlight sentence={currentSentence.text} onWordClick={handleWordClick} />
                </p>
              </div>

              {/* Vietnamese translation */}
              {subtitleMode !== 'en' && currentSentence.translation && (
                <div className="mb-4">
                  <p className="text-sm text-brand-400 selectable">
                    {currentSentence.translation.split(' ').map((word, i) => (
                      <span
                        key={i}
                        onClick={() => handleWordClick(word.replace(/[^a-zA-Z'-]/g, ''))}
                        className="cursor-pointer hover:text-brand-300 hover:bg-brand-950/30 px-0.5 rounded transition-colors inline"
                      >
                        {word}{' '}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* Playback controls */}
              {phase === 'idle' && (
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={playNativeSentence}
                    className="btn-primary px-6 py-2.5 flex items-center gap-2"
                  >
                    ▶️ Play Native ({playbackSpeed}x)
                  </button>
                  <button
                    onClick={toggleLoop}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      loopEnabled ? 'bg-amber-600 text-white' : 'btn-secondary'
                    }`}
                  >
                    🔁 Loop
                  </button>
                  {loopEnabled && (
                    <span className="text-xs text-amber-400">Repeat {loopMax}x</span>
                  )}
                </div>
              )}

              {/* Recording controls */}
              {phase === 'recording' && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-sm font-mono">
                      ⏱ {recordingTime.toFixed(1)}s
                    </span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="btn-secondary px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white"
                  >
                    ⏹ Stop Recording
                  </button>
                </div>
              )}

              {phase === 'listening' && (
                <div className="text-center mb-4">
                  <p className="text-brand-400 animate-pulse">🎧 Listening to native audio…</p>
                </div>
              )}

              {/* Waveforms */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">🎧 Native</p>
                  <WaveformVisualizer color="#38bdf8" isActive={playingNative} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">🎤 Your Voice</p>
                  <WaveformVisualizer color="#52c41a" isActive={recording} />
                </div>
              </div>

              {/* Score display */}
              {phase === 'scoring' && currentScore !== null && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-center space-y-3 mb-4"
                >
                  <div className="text-4xl mb-2">
                    {currentScore >= 90 ? '🌟' : currentScore >= 70 ? '👍' : '💪'}
                  </div>
                  <div className={`text-3xl font-bold ${scoreColor}`}>
                    {currentScore}%
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden max-w-xs mx-auto">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${currentScore}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full ${scoreBg} rounded-full`}
                    />
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg text-left max-w-md mx-auto">
                    <p className="text-sm text-gray-300">{currentFeedback}</p>
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 justify-center flex-wrap">
                {phase === 'scoring' && (
                  <>
                    <button
                      onClick={retrySentence}
                      className="btn-secondary px-5 py-2.5 text-sm"
                    >
                      🔄 Retry
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!allPassed && currentScore !== null && currentScore < 80}
                      className={`btn-primary px-5 py-2.5 text-sm ${
                        !allPassed && currentScore !== null && currentScore < 80
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {currentIndex < totalSentences - 1 ? 'Next Sentence →' : '🎉 Finish'}
                    </button>
                  </>
                )}
                {phase === 'idle' && !playingNative && (
                  <button
                    onClick={startRecording}
                    className="btn-primary px-8 py-3 text-base bg-red-600 hover:bg-red-500"
                  >
                    🎤 Record Now
                  </button>
                )}
                {(phase === 'done' || allPassed) && (
                  <button
                    onClick={() => setViewMode('review')}
                    className="btn-primary px-6 py-2.5 text-sm"
                  >
                    🔄 Review Weak Sentences
                  </button>
                )}
              </div>
            </div>

            {/* Sentence list */}
            <div className="card p-4">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">All Sentences</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {sentences.map((s, i) => {
                  const status = sentenceStatus(i)
                  const isActive = i === currentIndex
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-brand-950/40 border-l-2 border-brand-400'
                          : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <SentenceStatusBadge status={status} />
                      <span className={`text-sm truncate flex-1 ${
                        isActive ? 'text-white font-medium' : status === 'passed' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {s.text}
                      </span>
                      {results.find(r => r.sentenceIndex === i) && (
                        <span className={`text-xs font-mono ${
                          results.find(r => r.sentenceIndex === i)!.matchScore >= 80 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {results.find(r => r.sentenceIndex === i)!.matchScore}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="text-xs text-gray-600 flex items-center gap-4 justify-center">
              <span>Space = Play</span>
              <span>R = Record</span>
              <span>← → = Navigate</span>
            </div>
          </motion.div>
        )}

        {viewMode === 'free' && (
          <motion.div
            key="free"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Free mode: full transcript with highlighting */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">Full Transcript — Shadow Along</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={playNativeSentence}
                    disabled={phase === 'recording'}
                    className="btn-secondary px-4 py-1.5 text-xs"
                  >
                    ▶️ Play Full
                  </button>
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`px-4 py-1.5 text-xs rounded transition-colors ${
                      recording
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'btn-secondary'
                    }`}
                  >
                    {recording ? '⏹ Stop' : '🎤 Record'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {sentences.map((s, i) => {
                  const isActive = i === currentIndex
                  return (
                    <div
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`px-3 py-2 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? 'bg-brand-950/40 border-l-2 border-brand-400'
                          : 'hover:bg-gray-800/50'
                      }`}
                    >
                    <p className={`text-sm ${isActive ? 'text-white font-medium' : 'text-gray-400'}`}>
                          <AdvancedWordHighlight sentence={s.text} onWordClick={(w) => { handleWordClick(w); /* event propagation handled by component */ }} />
                        </p>
                      {subtitleMode !== 'en' && s.translation && (
                        <p className={`text-xs mt-1 selectable ${isActive ? 'text-brand-400' : 'text-gray-600'}`}>
                          {s.translation}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Waveforms */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">🎧 Native</p>
                  <WaveformVisualizer color="#38bdf8" isActive={playingNative} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">🎤 Your Voice</p>
                  <WaveformVisualizer color="#52c41a" isActive={recording} />
                </div>
              </div>

              {recording && (
                <div className="text-center mt-2">
                  <span className="text-red-400 text-sm font-mono">⏱ {recordingTime.toFixed(1)}s recording…</span>
                </div>
              )}
            </div>

            {/* Quick sentence navigation */}
            <div className="card p-4">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Jump to Sentence</h4>
              <div className="flex flex-wrap gap-1">
                {sentences.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-8 h-8 rounded text-xs flex items-center justify-center transition-colors ${
                      i === currentIndex
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-amber-400 mb-1">🔄 Review Weak Sentences</h3>
              <p className="text-xs text-gray-500">
                {results.filter(r => r.matchScore < 80).length} sentences need more practice
              </p>
            </div>

            {results.filter(r => r.matchScore < 80).map((r, i) => {
              const sentence = sentences[r.sentenceIndex]
              if (!sentence) return null
              return (
                <div key={i} className="card p-4 border-amber-900/30">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-red-400 text-sm">✗</span>
                    <span className={`text-xl font-semibold ${scoreColor}`}>{r.matchScore}%</span>
                  </div>
                  <p className="text-white selectable mb-1">{sentence.text}</p>
                  {subtitleMode !== 'en' && sentence.translation && (
                    <p className="text-xs text-brand-400 mb-2">{sentence.translation}</p>
                  )}
                  {r.phonemeFeedback && (
                    <p className="text-xs text-amber-400 mb-2">{r.phonemeFeedback}</p>
                  )}
                  <p className="text-xs text-gray-600 mb-2">Attempts: {r.attempts}</p>
                  <button
                    onClick={() => {
                      setCurrentIndex(r.sentenceIndex)
                      setViewMode('learn')
                    }}
                    className="btn-primary px-4 py-1.5 text-xs"
                  >
                    🔄 Practice This Again
                  </button>
                </div>
              )
            })}

            {results.filter(r => r.matchScore < 80).length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-white font-semibold">All sentences passed!</p>
                <p className="text-gray-500 text-sm mt-1">No review needed. Great job!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
