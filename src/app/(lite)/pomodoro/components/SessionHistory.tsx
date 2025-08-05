'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Database } from '@/lib/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, CheckCircle } from 'lucide-react'

type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row'] & {
  tags?: Database['public']['Tables']['tags']['Row'][]
}

type Tag = Database['public']['Tables']['tags']['Row']

interface SessionHistoryProps {
  sessions: PomodoroSession[]
  tags: Tag[]
}

export default function SessionHistory({ sessions }: SessionHistoryProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No sessions yet</h3>
        <p className="text-slate-500">Start your first Pomodoro session to see your history here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Session History</h2>
      
      <div className="space-y-3">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${
              session.is_completed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {session.is_completed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                  <h4 className="font-medium text-slate-900">
                    {session.title || 'Untitled Session'}
                  </h4>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(session.started_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(session.duration_minutes)}</span>
                  </div>
                </div>

                {session.tags && session.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {session.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                        style={{ 
                          backgroundColor: tag.color + '20', 
                          color: tag.color,
                          borderColor: tag.color + '40'
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className={`text-sm font-medium ${
                  session.is_completed ? 'text-green-700' : 'text-slate-500'
                }`}>
                  {session.is_completed ? 'Completed' : 'Incomplete'}
                </div>
                {session.completed_at && (
                  <div className="text-xs text-slate-500">
                    {format(new Date(session.completed_at), 'h:mm a')}
                  </div>
                )}
              </div>
            </div>

            {session.notes && (
              <div className="mt-3 p-2 bg-white rounded text-sm text-slate-700">
                {session.notes}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
