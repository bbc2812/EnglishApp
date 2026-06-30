import { useState, useRef, useCallback, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useProgressStore } from '../store/progressStore'

export interface TranscriptionSentence {
  text: string
  translation?: string
  startTime: number
  endTime: number
}

export interface ShadowingResult {
  sentenceIndex: number
  matchScore: number
  phonemeFeedback: string
  attempts: number
  passed: boolean
  duration: number
}

export type ShadowingPhase = 'idle' | 'listening' | 'recording' | 'playing-back' | 'scoring' | 'done'

export function useShadowing(sentences: TranscriptionSentence[]) {
  const [phase, setPhase] = useState<ShadowingPhase>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [results, setResults] = useState<ShadowingResult[]>([])
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState('')
  const [playingNative, setPlayingNative] = useState(false)
  const [loopCount, setLoopCount] = useState(0)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [loopMax, setLoopMax] = useState(3)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const { shadowingScoring, shadowingTargetScore } = useSettingsStore()
  const setTodayXP = useProgressStore(s => s.setTodayXP)

  const currentSentence = sentences[currentIndex]
  const totalSentences = sentences.length
  const completedCount = results.filter(r => r.passed).length
  const allPassed = totalSentences > 0 && completedCount === totalSentences

  const startFreeMode = useCallback(() => {
    setPhase('idle')
    setCurrentIndex(0)
    setCurrentScore(null)
    setCurrentFeedback('')
    setLoopCount(0)
  }, [])

  // Simulated scoring based on recording analysis
  const simulateScore = useCallback((recordingDuration: number, sentenceDuration: number, audioBlob: Blob): { score: number; feedback: string } => {
    const durationRatio = recordingDuration / sentenceDuration
    const durationScore = Math.max(0, 100 - Math.abs(durationRatio - 1) * 80)

    // Estimate word count from audio blob size (rough heuristic)
    const estimatedWords = Math.max(3, Math.floor(audioBlob.size / 500))
    const sentenceWordCount = currentSentence.text.split(/\s+/).length
    const wordCountMatch = Math.max(0, 100 - Math.abs(estimatedWords - sentenceWordCount) * 15)

    // Simulate phoneme-specific feedback based on common Vietnamese patterns
    const phonemeIssues: string[] = []
    const text = currentSentence.text.toLowerCase()

    if (/\b(th|this|that|than|there|think|thing|through|thought)\b/.test(text)) {
      phonemeIssues.push('Your /θ/ sound often becomes /s/ or /z/ — press tongue between teeth')
    }
    if (/\b(this|that|they|them|there|these|then|thus)\b/.test(text)) {
      phonemeIssues.push('/ð/ sound: voicing is weak — vibrate your vocal cords')
    }
    if (/\b(right|light|very|river|red|run|will|well)\b/.test(text)) {
      phonemeIssues.push('/r/ sound: don\'t use Vietnamese /r/ — curl tongue back slightly')
    }
    if (/\b(vest|very|love|have|live|five|three)\b/.test(text)) {
      phonemeIssues.push('/v/ sound: upper teeth on lower lip, don\'t say /w/')
    }
    if (/\b(watch|water|want|week|way|well|what|when)\b/.test(text)) {
      phonemeIssues.push('/w/ sound: round your lips, don\'t say /v/ or /f/')
    }
    if (/[.!]\s*$/.test(currentSentence.text)) {
      phonemeIssues.push('Final consonants: don\'t add a vowel sound after /t/, /k/, /p/')
    }

    // Fluency score (based on recording duration variance)
    const fluencyScore = Math.max(40, 90 - Math.abs(durationRatio - 1) * 40)

    // Combined score
    const score = Math.round(
      durationScore * 0.3 +
      wordCountMatch * 0.2 +
      (phonemeIssues.length === 0 ? 90 : Math.max(40, 90 - phonemeIssues.length * 15)) * 0.3 +
      fluencyScore * 0.2
    )

    let feedback = ''
    if (phonemeIssues.length > 0) {
      feedback = phonemeIssues[0]
      if (phonemeIssues.length > 1) {
        feedback += `. Also: ${phonemeIssues[1]}`
      }
    } else {
      feedback = 'Great pronunciation! Your rhythm and intonation are close to native.'
    }

    if (score < 60) {
      feedback += ' Try listening to this sentence 3 more times before recording.'
    } else if (score < 80) {
      feedback += ' Good effort! Focus on the specific sounds mentioned above.'
    }

    return { score: Math.min(100, Math.max(20, score)), feedback }
  }, [currentSentence])

  // AI scoring (when enabled in settings)
  const getAiScore = useCallback(async (sentenceText: string, recordingDuration: number): Promise<{ score: number; feedback: string }> => {
    const { chat } = window.api.ai

    const systemPrompt = `You are an English pronunciation coach for Vietnamese speakers.
Analyze the user's pronunciation based on:
- Sentence they need to say: "${sentenceText}"
- Their recording duration: ${recordingDuration}s

Consider common Vietnamese speaker issues:
- /θ/ (th) sounds like /s/ or /z/
- /ð/ (voiced th) sounds like /z/
- /r/ confused with /l/
- /v/ replaced with /w/
- Final consonants get added vowels (cat → "cat-uh")
- Sentence stress and intonation patterns

Return ONLY a JSON object: {"score": 0-100, "feedback": "specific phoneme feedback"}`

    const result = await chat(
      useSettingsStore.getState().activeProvider,
      [{ role: 'user', content: `Sentence: "${sentenceText}" | Recording duration: ${recordingDuration}s. Analyze pronunciation.` }],
      systemPrompt,
      {
        apiKey: useSettingsStore.getState().activeProvider === 'claude'
          ? useSettingsStore.getState().claudeApiKey
          : useSettingsStore.getState().activeProvider === 'gemini'
            ? useSettingsStore.getState().geminiApiKey
            : undefined,
      }
    )

    // Parse JSON from AI response
    try {
      const jsonMatch = result.match(/\{[^}]+\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { score: parsed.score || 70, feedback: parsed.feedback || result }
      }
    } catch { /* fallback */ }

    return { score: 70, feedback: result }
  }, [])

  const startRecording = useCallback(async () => {
    setPhase('recording')
    setRecording(true)
    setRecordingTime(0)
    setLoopCount(0)

    const timerInterval = setInterval(() => {
      setRecordingTime(prev => prev + 0.1)
    }, 100)
    timerRef.current = timerInterval

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up AudioContext for analysis
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        clearInterval(timerInterval)
        timerRef.current = null
        setRecording(false)
        stream.getTracks().forEach(t => t.stop())
        audioContext.close()

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const sentenceDuration = currentSentence.endTime - currentSentence.startTime

        // Scoring
        let scoreResult: { score: number; feedback: string }

        if (shadowingScoring === 'ai') {
          try {
            scoreResult = await getAiScore(currentSentence.text, recordingTime)
          } catch {
            scoreResult = simulateScore(recordingTime, sentenceDuration, audioBlob)
          }
        } else {
          scoreResult = simulateScore(recordingTime, sentenceDuration, audioBlob)
        }

        setCurrentScore(scoreResult.score)
        setCurrentFeedback(scoreResult.feedback)

        const passed = scoreResult.score >= shadowingTargetScore

        setResults(prev => {
          const existing = prev.find(r => r.sentenceIndex === currentIndex)
          if (existing) {
            return prev.map(r =>
              r.sentenceIndex === currentIndex
                ? { ...r, matchScore: scoreResult.score, phonemeFeedback: scoreResult.feedback, attempts: r.attempts + 1, passed }
                : r
            )
          }
          return [...prev, {
            sentenceIndex: currentIndex,
            matchScore: scoreResult.score,
            phonemeFeedback: scoreResult.feedback,
            attempts: 1,
            passed,
            duration: recordingTime
          }]
        })

        setPhase('scoring')
      }

      mediaRecorder.start()
    } catch {
      clearInterval(timerInterval)
      timerRef.current = null
      setRecording(false)
      setCurrentFeedback('Microphone access denied. Using simulated scoring.')
      setPhase('scoring')
    }
  }, [currentSentence, currentIndex, recordingTime, shadowingScoring, shadowingTargetScore, simulateScore, getAiScore])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const playNativeSentence = useCallback(() => {
    setPhase('listening')
    setPlayingNative(true)

    // Simulate playback of sentence duration
    const duration = (currentSentence.endTime - currentSentence.startTime) * 1000 / playbackSpeed

    // Auto-loop if enabled
    if (loopEnabled && loopCount < loopMax) {
      const loopTimer = setTimeout(() => {
        setLoopCount(prev => {
          const next = prev + 1
          if (next >= loopMax) {
            setLoopEnabled(false)
            setPlayingNative(false)
            setPhase('idle')
            return 0
          }
          return next
        })
      }, duration)

      setTimeout(() => {
        setPlayingNative(false)
        clearTimeout(loopTimer)
      }, duration)
    } else {
      setTimeout(() => {
        setPlayingNative(false)
        setPhase('idle')
      }, duration)
    }
  }, [currentSentence, playbackSpeed, loopEnabled, loopCount, loopMax])

  const nextSentence = useCallback(() => {
    if (currentIndex < totalSentences - 1) {
      setCurrentIndex(prev => prev + 1)
      setCurrentScore(null)
      setCurrentFeedback('')
      setPhase('idle')
      setLoopCount(0)
    } else {
      setPhase('done')
    }
  }, [currentIndex, totalSentences])

  const prevSentence = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setCurrentScore(null)
      setCurrentFeedback('')
      setPhase('idle')
      setLoopCount(0)
    }
  }, [currentIndex])

  const retrySentence = useCallback(() => {
    setCurrentScore(null)
    setCurrentFeedback('')
    setPhase('idle')
    setLoopCount(0)
  }, [])

  const toggleLoop = useCallback(() => {
    setLoopEnabled(prev => !prev)
    setLoopCount(0)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'idle' || phase === 'scoring') {
        if (e.code === 'Space') {
          e.preventDefault()
          if (phase === 'idle') {
            if (!playingNative) playNativeSentence()
          }
        }
        if (e.code === 'KeyR') {
          e.preventDefault()
          if (!recording) startRecording()
          else stopRecording()
        }
        if (e.code === 'ArrowRight') {
          e.preventDefault()
          nextSentence()
        }
        if (e.code === 'ArrowLeft') {
          e.preventDefault()
          prevSentence()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, playingNative, recording, playNativeSentence, startRecording, stopRecording, nextSentence, prevSentence])

  // Save result to DB when scoring is done
  useEffect(() => {
    if (phase === 'scoring' && currentScore !== null && currentSentence) {
      const lastResult = results[results.length - 1]
      if (lastResult && lastResult.sentenceIndex === currentIndex) {
        window.api.shadowing.save({
          episodeType: 'youtube', // default, will be overridden
          episodeId: '', // will be overridden
          sentenceIndex: currentIndex,
          sentenceText: currentSentence.text,
          sentenceTranslation: currentSentence.translation,
          matchScore: currentScore,
          phonemeFeedback: currentFeedback,
          attempts: lastResult.attempts,
          passed: lastResult.passed ? 1 : 0,
          mode: 'learn'
        }).then(() => {
          setTodayXP(currentScore >= 80 ? 5 : 2)
        }).catch(() => {})
      }
    }
  }, [phase, currentScore, currentIndex, currentFeedback, currentSentence, results, setTodayXP])

  return {
    // State
    phase,
    currentIndex,
    recording,
    recordingTime,
    results,
    currentScore,
    currentFeedback,
    playingNative,
    loopCount,
    loopEnabled,
    loopMax,
    playbackSpeed,
    allPassed,
    completedCount,
    totalSentences,
    currentSentence,

    // Actions
    playNativeSentence,
    startRecording,
    stopRecording,
    nextSentence,
    retrySentence,
    startFreeMode,
    toggleLoop,
    setLoopMax,
    setPlaybackSpeed,
    setCurrentIndex,

    // Computed
    scoreColor: currentScore !== null ? (currentScore >= 90 ? 'text-green-400' : currentScore >= 70 ? 'text-amber-400' : 'text-red-400') : '',
    scoreBg: currentScore !== null ? (currentScore >= 90 ? 'bg-green-500' : currentScore >= 70 ? 'bg-amber-500' : 'bg-red-500') : '',
    sentenceStatus: (idx: number) => {
      const result = results.find(r => r.sentenceIndex === idx)
      if (result?.passed) return 'passed'
      if (result) return 'attempting'
      if (idx < currentIndex) return 'failed'
      return 'pending'
    }
  }
}
