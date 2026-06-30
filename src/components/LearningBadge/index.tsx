import { useState, useEffect, useCallback } from 'react'

interface LearningBadgeProps {
  type: 'video' | 'audio' | 'article' | 'lesson' | 'shadowing'
  itemId: string
  itemTitle: string
  source?: string
  cefrLevel?: string
  className?: string
  compact?: boolean
}

export default function LearningBadge({
  type,
  itemId,
  itemTitle,
  source,
  cefrLevel,
  className = '',
  compact = false
}: LearningBadgeProps): JSX.Element {
  const [learnt, setLearnt] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkLearnt = useCallback(async () => {
    try {
      const isLearnt = await window.api.learning.isLearnt(type, itemId)
      setLearnt(isLearnt)
    } catch { /* ignore */ }
  }, [type, itemId])

  useEffect(() => {
    checkLearnt()
  }, [checkLearnt])

  const toggleLearnt = async () => {
    if (loading) return
    setLoading(true)
    try {
      const result = await window.api.learning.mark({
        type,
        itemId,
        itemTitle,
        source,
        cefrLevel
      })
      setLearnt(result.nowLearnt)
    } catch { /* ignore */ }
    setLoading(false)
  }

  if (compact) {
    return (
      <button
        onClick={toggleLearnt}
        disabled={loading}
        className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all ${
          learnt
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-gray-800/60 text-gray-500 hover:bg-gray-700/60 hover:text-gray-300 border border-gray-700/50'
        } ${className}`}
      >
        {learnt ? '✅' : loading ? '...' : '📝'}
      </button>
    )
  }

  return (
    <button
      onClick={toggleLearnt}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
        learnt
          ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15'
          : 'bg-gray-800/60 text-gray-500 hover:bg-gray-700/60 hover:text-gray-300 border border-gray-700/40 hover:border-gray-600'
      } ${className}`}
    >
      {learnt ? (
        <>
          <span>✅</span>
          <span>Learnt</span>
        </>
      ) : (
        <>
          <span>{loading ? '...' : '📝'}</span>
          <span>Mark as Learnt</span>
        </>
      )}
    </button>
  )
}
