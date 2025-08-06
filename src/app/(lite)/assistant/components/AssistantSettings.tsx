import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Clock, 
  Calendar,
  Target,
  CheckSquare,
  Coffee,
  Settings
} from 'lucide-react'

interface NotificationPreferences {
  id?: string
  user_id: string
  daily_summary_enabled: boolean
  daily_summary_time: string
  daily_summary_methods: string[]
  weekly_review_enabled: boolean
  weekly_review_day: number
  weekly_review_time: string
  weekly_review_methods: string[]
  task_reminders_enabled: boolean
  task_reminder_advance_hours: number
  task_reminder_methods: string[]
  time_block_reminders_enabled: boolean
  time_block_reminder_advance_minutes: number
  time_block_reminder_methods: string[]
  pomodoro_suggestions_enabled: boolean
  pomodoro_suggestion_interval_hours: number
  break_reminders_enabled: boolean
  break_reminder_interval_minutes: number
  email_address?: string
  telegram_chat_id?: string
  timezone: string
}

interface AssistantSettingsProps {
  preferences: NotificationPreferences
  onSave: (preferences: NotificationPreferences) => void
  onClose: () => void
}

const deliveryMethods = [
  { id: 'in_app', label: 'In-App', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'push', label: 'Push', icon: Smartphone },
  { id: 'telegram', label: 'Telegram', icon: MessageSquare }
]

const weekDays = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

const timezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'Pacific/Auckland'
]

export default function AssistantSettings({ preferences, onSave, onClose }: AssistantSettingsProps) {
  const [settings, setSettings] = useState<NotificationPreferences>(preferences)

  const updateSettings = (updates: Partial<NotificationPreferences>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const toggleDeliveryMethod = (category: string, method: string) => {
    const key = `${category}_methods` as keyof NotificationPreferences
    const currentMethods = settings[key] as string[]
    
    if (currentMethods.includes(method)) {
      updateSettings({
        [key]: currentMethods.filter(m => m !== method)
      } as Partial<NotificationPreferences>)
    } else {
      updateSettings({
        [key]: [...currentMethods, method]
      } as Partial<NotificationPreferences>)
    }
  }

  const handleSave = () => {
    onSave(settings)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Assistant Settings
          </h2>
          <p className="text-gray-600">Configure your smart assistant preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic configuration for your assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={settings.email_address || ''}
                onChange={(e) => updateSettings({ email_address: e.target.value })}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="telegram">Telegram Chat ID (Optional)</Label>
            <Input
              id="telegram"
              value={settings.telegram_chat_id || ''}
              onChange={(e) => updateSettings({ telegram_chat_id: e.target.value })}
              placeholder="123456789"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              To get your Chat ID, message @userinfobot on Telegram
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Summary
          </CardTitle>
          <CardDescription>
            Get a daily overview of your tasks, schedule, and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="daily-enabled"
              checked={settings.daily_summary_enabled}
              onChange={(e) => updateSettings({ daily_summary_enabled: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="daily-enabled">Enable daily summary</Label>
          </div>

          {settings.daily_summary_enabled && (
            <>
              <div>
                <Label htmlFor="daily-time">Summary Time</Label>
                <Input
                  id="daily-time"
                  type="time"
                  value={settings.daily_summary_time}
                  onChange={(e) => updateSettings({ daily_summary_time: e.target.value })}
                  className="mt-1 w-40"
                />
              </div>

              <div>
                <Label>Delivery Methods</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {deliveryMethods.map(method => {
                    const isActive = settings.daily_summary_methods.includes(method.id)
                    const IconComponent = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => toggleDeliveryMethod('daily_summary', method.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                          isActive 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {method.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Weekly Review Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Weekly Review
          </CardTitle>
          <CardDescription>
            Receive a comprehensive weekly productivity review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="weekly-enabled"
              checked={settings.weekly_review_enabled}
              onChange={(e) => updateSettings({ weekly_review_enabled: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="weekly-enabled">Enable weekly review</Label>
          </div>

          {settings.weekly_review_enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weekly-day">Review Day</Label>
                  <select
                    id="weekly-day"
                    value={settings.weekly_review_day}
                    onChange={(e) => updateSettings({ weekly_review_day: parseInt(e.target.value) })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {weekDays.map((day, index) => (
                      <option key={day} value={index}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="weekly-time">Review Time</Label>
                  <Input
                    id="weekly-time"
                    type="time"
                    value={settings.weekly_review_time}
                    onChange={(e) => updateSettings({ weekly_review_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Delivery Methods</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {deliveryMethods.map(method => {
                    const isActive = settings.weekly_review_methods.includes(method.id)
                    const IconComponent = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => toggleDeliveryMethod('weekly_review', method.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                          isActive 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {method.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Task Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Task Reminders
          </CardTitle>
          <CardDescription>
            Get notified about upcoming task deadlines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="task-enabled"
              checked={settings.task_reminders_enabled}
              onChange={(e) => updateSettings({ task_reminders_enabled: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="task-enabled">Enable task reminders</Label>
          </div>

          {settings.task_reminders_enabled && (
            <>
              <div>
                <Label htmlFor="task-advance">Reminder Advance Time (hours)</Label>
                <Input
                  id="task-advance"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.task_reminder_advance_hours}
                  onChange={(e) => updateSettings({ task_reminder_advance_hours: parseInt(e.target.value) || 24 })}
                  className="mt-1 w-32"
                />
              </div>

              <div>
                <Label>Delivery Methods</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {deliveryMethods.map(method => {
                    const isActive = settings.task_reminder_methods.includes(method.id)
                    const IconComponent = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => toggleDeliveryMethod('task_reminder', method.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                          isActive 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {method.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Time Block Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Block Reminders
          </CardTitle>
          <CardDescription>
            Get notified before scheduled time blocks start
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="timeblock-enabled"
              checked={settings.time_block_reminders_enabled}
              onChange={(e) => updateSettings({ time_block_reminders_enabled: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="timeblock-enabled">Enable time block reminders</Label>
          </div>

          {settings.time_block_reminders_enabled && (
            <>
              <div>
                <Label htmlFor="timeblock-advance">Reminder Advance Time (minutes)</Label>
                <Input
                  id="timeblock-advance"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.time_block_reminder_advance_minutes}
                  onChange={(e) => updateSettings({ time_block_reminder_advance_minutes: parseInt(e.target.value) || 15 })}
                  className="mt-1 w-32"
                />
              </div>

              <div>
                <Label>Delivery Methods</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {deliveryMethods.map(method => {
                    const isActive = settings.time_block_reminder_methods.includes(method.id)
                    const IconComponent = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => toggleDeliveryMethod('time_block_reminder', method.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${
                          isActive 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {method.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Break & Pomodoro Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5" />
            Break & Focus Reminders
          </CardTitle>
          <CardDescription>
            Automated suggestions for breaks and Pomodoro sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pomodoro Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pomodoro-enabled"
                checked={settings.pomodoro_suggestions_enabled}
                onChange={(e) => updateSettings({ pomodoro_suggestions_enabled: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="pomodoro-enabled">Enable Pomodoro suggestions</Label>
            </div>

            {settings.pomodoro_suggestions_enabled && (
              <div>
                <Label htmlFor="pomodoro-interval">Suggestion Interval (hours)</Label>
                <Input
                  id="pomodoro-interval"
                  type="number"
                  min="1"
                  max="8"
                  value={settings.pomodoro_suggestion_interval_hours}
                  onChange={(e) => updateSettings({ pomodoro_suggestion_interval_hours: parseInt(e.target.value) || 2 })}
                  className="mt-1 w-32"
                />
              </div>
            )}
          </div>

          {/* Break Reminders */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="break-enabled"
                checked={settings.break_reminders_enabled}
                onChange={(e) => updateSettings({ break_reminders_enabled: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="break-enabled">Enable break reminders</Label>
            </div>

            {settings.break_reminders_enabled && (
              <div>
                <Label htmlFor="break-interval">Break Interval (minutes)</Label>
                <Input
                  id="break-interval"
                  type="number"
                  min="30"
                  max="240"
                  value={settings.break_reminder_interval_minutes}
                  onChange={(e) => updateSettings({ break_reminder_interval_minutes: parseInt(e.target.value) || 90 })}
                  className="mt-1 w-32"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-6 border-t">
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
