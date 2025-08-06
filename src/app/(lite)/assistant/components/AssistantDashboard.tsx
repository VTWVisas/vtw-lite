import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, MessageCircle, Settings, Calendar, CheckSquare, Target, Clock } from 'lucide-react'

interface Reminder {
  id: string
  title: string
  message: string
  type: 'daily_summary' | 'weekly_review' | 'task_due' | 'time_block_starting' | 'pomodoro_reminder' | 'habit_reminder' | 'deadline_warning' | 'break_suggestion'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduled_for: string
  is_sent: boolean
  is_read?: boolean
  created_at: string
}

interface AssistantDashboardProps {
  reminders: Reminder[]
  onDismissReminder: (id: string) => void
  onOpenSettings: () => void
  onStartChat: () => void
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const typeIcons = {
  daily_summary: Calendar,
  weekly_review: Target,
  task_due: CheckSquare,
  time_block_starting: Clock,
  pomodoro_reminder: Clock,
  habit_reminder: Target,
  deadline_warning: Bell,
  break_suggestion: MessageCircle
}

export default function AssistantDashboard({ 
  reminders, 
  onDismissReminder, 
  onOpenSettings, 
  onStartChat 
}: AssistantDashboardProps) {
  const unreadReminders = reminders.filter(r => r.is_sent && !r.is_read)
  const todayReminders = reminders.filter(r => {
    const reminderDate = new Date(r.scheduled_for).toDateString()
    const today = new Date().toDateString()
    return reminderDate === today
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Assistant</h1>
          <p className="text-gray-600">Your AI-powered productivity companion</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onStartChat} variant="outline" size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Assistant
          </Button>
          <Button onClick={onOpenSettings} variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Reminders</p>
                <p className="text-2xl font-bold text-gray-900">{unreadReminders.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{todayReminders.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reminders</p>
                <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recent Reminders
          </CardTitle>
          <CardDescription>
            Your latest notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reminders yet</p>
              <p className="text-sm">We&apos;ll notify you about important events and deadlines</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.slice(0, 10).map((reminder) => {
                const IconComponent = typeIcons[reminder.type] || Bell
                return (
                  <div
                    key={reminder.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-gray-600 mt-0.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {reminder.title}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={priorityColors[reminder.priority]}
                        >
                          {reminder.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {reminder.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {new Date(reminder.scheduled_for).toLocaleDateString()} at{' '}
                          {new Date(reminder.scheduled_for).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <span className="capitalize">
                          {reminder.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        onClick={() => onDismissReminder(reminder.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {reminders.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    View All Reminders ({reminders.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common assistant tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex-col gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">Ask Assistant</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Today&apos;s Focus</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Target className="w-5 h-5" />
              <span className="text-sm">Weekly Review</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Settings className="w-5 h-5" />
              <span className="text-sm">Preferences</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
