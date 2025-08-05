'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Timer, 
  Coffee,
  Plus,
  X
} from 'lucide-react'

type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row']
type Tag = Database['public']['Tables']['tags']['Row']
type TimerState = 'idle' | 'working' | 'break' | 'paused'

interface PomodoroSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
}

interface PomodoroTimerProps {
  state: TimerState
  session: PomodoroSession | null
  settings: PomodoroSettings
  tags: Tag[]
  onStart: (title: string, selectedTags: string[]) => void
  onComplete: () => void
  onCancel: () => void
  onStateChange: (state: TimerState) => void
}

export default function PomodoroTimer({
  state,
  session,
  settings,
  tags,
  onStart,
  onComplete,
  onCancel,
  onStateChange
}: PomodoroTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60)
  const [sessionTitle, setSessionTitle] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isBreakTime, setIsBreakTime] = useState(false)
  const [showStartForm, setShowStartForm] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize timer when session changes
  useEffect(() => {
    if (session && state === 'working') {
      setTimeRemaining(session.duration_minutes * 60)
      setIsBreakTime(false)
    } else if (state === 'break') {
      setTimeRemaining((session?.break_duration_minutes || settings.shortBreakDuration) * 60)
      setIsBreakTime(true)
    } else if (state === 'idle') {
      setTimeRemaining(settings.workDuration * 60)
      setIsBreakTime(false)
    }
  }, [session, state, settings])

  // Timer countdown logic
  useEffect(() => {
    if (state === 'working' || state === 'break') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer finished
            if (state === 'working') {
              // Work session completed, start break
              onStateChange('break')
              playNotificationSound()
              setIsBreakTime(true)
              return (session?.break_duration_minutes || settings.shortBreakDuration) * 60
            } else {
              // Break completed, ready for next session
              onComplete()
              playNotificationSound()
              return settings.workDuration * 60
            }
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state, session, settings, onComplete, onStateChange])

  const playNotificationSound = () => {
    // Create a simple beep sound
    if (typeof window !== 'undefined' && window.AudioContext) {
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
      
      oscillator.start(context.currentTime)
      oscillator.stop(context.currentTime + 0.5)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalTime = isBreakTime 
      ? (session?.break_duration_minutes || settings.shortBreakDuration) * 60
      : (session?.duration_minutes || settings.workDuration) * 60
    return ((totalTime - timeRemaining) / totalTime) * 100
  }

  const handleStart = () => {
    if (sessionTitle.trim() || selectedTags.length > 0) {
      onStart(sessionTitle.trim(), selectedTags)
      setShowStartForm(false)
      setSessionTitle('')
      setSelectedTags([])
    } else {
      setShowStartForm(true)
    }
  }

  const handlePause = () => {
    onStateChange('paused')
  }

  const handleResume = () => {
    onStateChange(isBreakTime ? 'break' : 'working')
  }

  const handleStop = () => {
    onCancel()
    setShowStartForm(false)
    setSessionTitle('')
    setSelectedTags([])
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const circumference = 2 * Math.PI * 120
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (getProgress() / 100) * circumference

  return (
    <div className="text-center space-y-8">
      {/* Timer Circle */}
      <motion.div 
        className="relative mx-auto"
        style={{ width: 280, height: 280 }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200"
          />
          {/* Progress circle */}
          <motion.circle
            cx="140"
            cy="140"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={isBreakTime ? 'text-green-500' : 'text-red-500'}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        
        {/* Timer content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={`${isBreakTime}-${state}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            {isBreakTime ? (
              <Coffee className="w-8 h-8 mx-auto mb-2 text-green-500" />
            ) : (
              <Timer className="w-8 h-8 mx-auto mb-2 text-red-500" />
            )}
            
            <div className="text-4xl font-mono font-bold text-slate-900">
              {formatTime(timeRemaining)}
            </div>
            
            <div className="text-sm font-medium text-slate-600 mt-1">
              {isBreakTime ? 'Break Time' : state === 'paused' ? 'Paused' : 'Focus Time'}
            </div>

            {session?.title && (
              <div className="text-xs text-slate-500 mt-2 max-w-32 truncate">
                {session.title}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div 
        className="flex justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {state === 'idle' && (
          <Button
            onClick={handleStart}
            size="lg"
            className="px-8"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Focus
          </Button>
        )}

        {(state === 'working' || state === 'break') && (
          <>
            <Button
              onClick={handlePause}
              variant="outline"
              size="lg"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
            <Button
              onClick={handleStop}
              variant="destructive"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}

        {state === 'paused' && (
          <>
            <Button
              onClick={handleResume}
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Resume
            </Button>
            <Button
              onClick={handleStop}
              variant="destructive"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}
      </motion.div>

      {/* Start Session Form */}
      <AnimatePresence>
        {showStartForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 rounded-lg p-4 space-y-4 max-w-md mx-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Session Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStartForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="session-title">What are you working on?</Label>
                <Input
                  id="session-title"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g., Write blog post, Study math..."
                  className="mt-1"
                />
              </div>

              {tags.length > 0 && (
                <div>
                  <Label>Tags (optional)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.slice(0, 6).map((tag) => {
                      const isSelected = selectedTags.includes(tag.id)
                      return (
                        <motion.button
                          key={tag.id}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTagToggle(tag.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                            isSelected ? 'ring-2 ring-offset-1' : 'hover:shadow-sm'
                          }`}
                          style={{
                            backgroundColor: isSelected ? tag.color : tag.color + '20',
                            color: isSelected ? 'white' : tag.color,
                          }}
                        >
                          {isSelected && <Plus className="w-2 h-2 rotate-45" />}
                          {tag.name}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStartForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => onStart(sessionTitle.trim(), selectedTags)}
                >
                  Start Timer
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Info */}
      {state !== 'idle' && session && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-slate-600 max-w-md mx-auto"
        >
          {session.title && (
            <div className="font-medium mb-1">{session.title}</div>
          )}
          <div className="text-xs">
            Duration: {session.duration_minutes} min work, {session.break_duration_minutes} min break
          </div>
        </motion.div>
      )}
    </div>
  )
}
