'use client'

import { motion } from 'framer-motion'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns'
import { Database } from '@/lib/types/database.types'
import { Card } from '@/components/ui/card'
import { TrendingUp, Clock, Target, Calendar } from 'lucide-react'

type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row'] & {
  tags?: Database['public']['Tables']['tags']['Row'][]
}

interface SessionStatsProps {
  sessions: PomodoroSession[]
  detailed?: boolean
}

export default function SessionStats({ sessions, detailed = false }: SessionStatsProps) {
  const completedSessions = sessions.filter(s => s.is_completed)
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  
  // Today's stats
  const today = new Date()
  const todaySessions = completedSessions.filter(s => 
    format(new Date(s.started_at), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  )
  
  // This week's stats
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  const thisWeekSessions = completedSessions.filter(s => {
    const sessionDate = new Date(s.started_at)
    return sessionDate >= weekStart && sessionDate <= weekEnd
  })

  // Weekly breakdown
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const dailyStats = weekDays.map(day => {
    const daySessions = completedSessions.filter(s =>
      format(new Date(s.started_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )
    return {
      date: day,
      sessions: daySessions.length,
      minutes: daySessions.reduce((sum, s) => sum + s.duration_minutes, 0)
    }
  })

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (!detailed) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Quick Stats
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Today</span>
            <div className="text-right">
              <div className="font-medium text-slate-900">{todaySessions.length}</div>
              <div className="text-xs text-slate-500">sessions</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">This week</span>
            <div className="text-right">
              <div className="font-medium text-slate-900">{thisWeekSessions.length}</div>
              <div className="text-xs text-slate-500">sessions</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Total time</span>
            <div className="text-right">
              <div className="font-medium text-slate-900">{formatTime(totalMinutes)}</div>
              <div className="text-xs text-slate-500">focused</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Detailed Statistics</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{completedSessions.length}</div>
              <div className="text-sm text-slate-600">Total Sessions</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatTime(totalMinutes)}</div>
              <div className="text-sm text-slate-600">Total Time</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{todaySessions.length}</div>
              <div className="text-sm text-slate-600">Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{thisWeekSessions.length}</div>
              <div className="text-sm text-slate-600">This Week</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">This Week&apos;s Activity</h3>
        <div className="space-y-3">
          {dailyStats.map((day, index) => (
            <motion.div
              key={day.date.toISOString()}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className={`w-12 text-sm ${
                isToday(day.date) ? 'font-bold text-blue-600' : 'text-slate-600'
              }`}>
                {format(day.date, 'EEE')}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (day.minutes / 120) * 100)}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                  </div>
                  <div className="text-sm font-medium text-slate-900 w-12 text-right">
                    {day.sessions}
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatTime(day.minutes)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Average Session Length */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Session Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-600 mb-1">Average Session</div>
            <div className="text-xl font-bold text-slate-900">
              {completedSessions.length > 0
                ? formatTime(Math.round(totalMinutes / completedSessions.length))
                : '0m'
              }
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">Success Rate</div>
            <div className="text-xl font-bold text-slate-900">
              {sessions.length > 0
                ? Math.round((completedSessions.length / sessions.length) * 100)
                : 0
              }%
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
