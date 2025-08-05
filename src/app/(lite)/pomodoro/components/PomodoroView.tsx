'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'
import PomodoroTimer from './PomodoroTimer'
import SessionHistory from './SessionHistory'
import PomodoroSettings from './PomodoroSettings'
import SessionStats from './SessionStats'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, BarChart3, History } from 'lucide-react'

type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row'] & {
  tags?: Database['public']['Tables']['tags']['Row'][]
}

type Tag = Database['public']['Tables']['tags']['Row']

type TimerState = 'idle' | 'working' | 'break' | 'paused'

interface PomodoroSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
}

export default function PomodoroView() {
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeView, setActiveView] = useState<'timer' | 'history' | 'stats' | 'settings'>('timer')
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  })

  const supabase = createClient()

  // Load sessions and tags
  useEffect(() => {
    loadSessions()
    loadTags()
  }, [])

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select(`
          *,
          pomodoro_session_tags (
            tags (*)
          )
        `)
        .order('started_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Transform the data to include tags
      const transformedSessions: PomodoroSession[] = data?.map(session => ({
        ...session,
        tags: session.pomodoro_session_tags?.map((pst: any) => pst.tags).filter(Boolean) || []
      })) || []

      setSessions(transformedSessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const startSession = async (title: string, selectedTags: string[]) => {
    try {
      const now = new Date()
      
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert([{
          title: title || null,
          duration_minutes: settings.workDuration,
          break_duration_minutes: settings.shortBreakDuration,
          started_at: now.toISOString(),
          is_completed: false
        }])
        .select()
        .single()

      if (error) throw error

      // Add tag associations
      if (selectedTags.length > 0) {
        const tagAssociations = selectedTags.map(tagId => ({
          pomodoro_session_id: data.id,
          tag_id: tagId
        }))

        await supabase
          .from('pomodoro_session_tags')
          .insert(tagAssociations)
      }

      setCurrentSession(data)
      setTimerState('working')
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Error starting session')
    }
  }

  const completeSession = async () => {
    if (!currentSession) return

    try {
      const now = new Date()
      
      const { error } = await supabase
        .from('pomodoro_sessions')
        .update({
          completed_at: now.toISOString(),
          is_completed: true
        })
        .eq('id', currentSession.id)

      if (error) throw error

      setCurrentSession(null)
      setTimerState('idle')
      loadSessions() // Reload to get updated list
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const cancelSession = async () => {
    if (!currentSession) return

    try {
      const { error } = await supabase
        .from('pomodoro_sessions')
        .delete()
        .eq('id', currentSession.id)

      if (error) throw error

      setCurrentSession(null)
      setTimerState('idle')
    } catch (error) {
      console.error('Error canceling session:', error)
    }
  }

  const handleSessionComplete = useCallback(() => {
    completeSession()
  }, [completeSession])

  const handleSessionCancel = useCallback(() => {
    cancelSession()
  }, [cancelSession])

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        <Button
          variant={activeView === 'timer' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('timer')}
        >
          Timer
        </Button>
        <Button
          variant={activeView === 'history' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('history')}
        >
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
        <Button
          variant={activeView === 'stats' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('stats')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Stats
        </Button>
        <Button
          variant={activeView === 'settings' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </motion.div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeView === 'timer' && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Timer - Main Content */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <PomodoroTimer
                  state={timerState}
                  session={currentSession}
                  settings={settings}
                  tags={tags}
                  onStart={startSession}
                  onComplete={handleSessionComplete}
                  onCancel={handleSessionCancel}
                  onStateChange={setTimerState}
                />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="p-4">
                <SessionStats sessions={sessions} />
              </Card>
            </div>
          </motion.div>
        )}

        {activeView === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="p-6">
              <SessionHistory sessions={sessions} tags={tags} />
            </Card>
          </motion.div>
        )}

        {activeView === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="p-6">
              <SessionStats sessions={sessions} detailed />
            </Card>
          </motion.div>
        )}

        {activeView === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="p-6">
              <PomodoroSettings
                settings={settings}
                onSettingsChange={setSettings}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
