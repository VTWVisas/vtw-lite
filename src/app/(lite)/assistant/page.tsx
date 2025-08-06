'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AssistantDashboard from './components/AssistantDashboard'
import AssistantSettings from './components/AssistantSettings'
import AssistantChat from './components/AssistantChat'

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

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface Conversation {
  id: string
  title?: string
  messages: Message[]
  created_at: string
  updated_at: string
}

export default function AssistantPage() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'chat'>('dashboard')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please sign in to access the assistant')
        return
      }

      // Load reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (remindersError) {
        console.error('Error loading reminders:', remindersError)
      } else {
        setReminders(remindersData || [])
      }

      // Load notification preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (preferencesError) {
        if (preferencesError.code === 'PGRST116') {
          // No preferences found, create default ones
          const defaultPreferences: NotificationPreferences = {
            user_id: user.id,
            daily_summary_enabled: true,
            daily_summary_time: '07:00',
            daily_summary_methods: ['in_app'],
            weekly_review_enabled: true,
            weekly_review_day: 0, // Sunday
            weekly_review_time: '18:00',
            weekly_review_methods: ['in_app'],
            task_reminders_enabled: true,
            task_reminder_advance_hours: 24,
            task_reminder_methods: ['in_app'],
            time_block_reminders_enabled: true,
            time_block_reminder_advance_minutes: 15,
            time_block_reminder_methods: ['in_app'],
            pomodoro_suggestions_enabled: true,
            pomodoro_suggestion_interval_hours: 2,
            break_reminders_enabled: true,
            break_reminder_interval_minutes: 90,
            timezone: 'UTC'
          }
          setPreferences(defaultPreferences)
        } else {
          console.error('Error loading preferences:', preferencesError)
        }
      } else {
        setPreferences(preferencesData)
      }

    } catch (err) {
      console.error('Error loading assistant data:', err)
      setError('Failed to load assistant data')
    } finally {
      setLoading(false)
    }
  }

  const handleDismissReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_read: true })
        .eq('id', reminderId)

      if (error) {
        console.error('Error dismissing reminder:', error)
        return
      }

      setReminders(prev => prev.filter(r => r.id !== reminderId))
    } catch (err) {
      console.error('Error dismissing reminder:', err)
    }
  }

  const handleSavePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          ...newPreferences,
          user_id: user.id
        })

      if (error) {
        console.error('Error saving preferences:', error)
        return
      }

      setPreferences(newPreferences)
      setCurrentView('dashboard')
    } catch (err) {
      console.error('Error saving preferences:', err)
    }
  }

  const handleSendMessage = async (message: string): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create or get conversation
      let conversationId = conversation?.id
      if (!conversationId) {
        const { data: newConversation, error: conversationError } = await supabase
          .from('assistant_conversations')
          .insert({
            user_id: user.id,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
          })
          .select()
          .single()

        if (conversationError) throw conversationError
        conversationId = newConversation.id
      }

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      }

      const { error: userMessageError } = await supabase
        .from('assistant_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message
        })

      if (userMessageError) throw userMessageError

      // Generate AI response (placeholder)
      const aiResponse = await generateAIResponse(message, user.id)

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString()
      }

      const { error: assistantMessageError } = await supabase
        .from('assistant_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse
        })

      if (assistantMessageError) throw assistantMessageError

      // Update conversation state
      setConversation(prev => {
        if (prev && prev.id === conversationId) {
          return {
            ...prev,
            messages: [...prev.messages, userMessage, assistantMessage]
          }
        } else {
          return {
            id: conversationId!,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            messages: [userMessage, assistantMessage],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      })

      return aiResponse
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }

  const generateAIResponse = async (message: string, _userId: string): Promise<string> => {
    // This is a placeholder for AI integration
    // In a real implementation, you would call OpenAI API or your preferred AI service
    
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('focus') || lowerMessage.includes('today')) {
      return `Based on your current tasks and schedule, here are my recommendations for today:

🎯 **Priority Focus:**
• Complete your high-priority tasks first
• Allocate focused time blocks for deep work
• Take regular breaks to maintain productivity

📅 **Today's Schedule:**
I can see you have several time blocks planned. Make sure to stick to your schedule and use the Pomodoro technique for better focus.

💡 **Pro Tip:**
Start with your most challenging task when your energy is highest, typically in the morning.

Would you like me to help you prioritize specific tasks or create a focus plan?`
    }
    
    if (lowerMessage.includes('goal') || lowerMessage.includes('progress')) {
      return `Let me analyze your goal progress:

🎖️ **Goal Status:**
• I can help you track progress on your active goals
• Set up milestone reminders for better accountability
• Suggest actionable steps to reach your targets

📊 **Progress Insights:**
Regular review of your goals helps maintain momentum. Consider breaking large goals into smaller, manageable tasks.

🚀 **Next Steps:**
Would you like me to help you set up specific goal milestones or create a progress tracking system?`
    }
    
    if (lowerMessage.includes('task') || lowerMessage.includes('overdue')) {
      return `Here's your task overview:

📋 **Task Management:**
• I can help identify overdue and upcoming tasks
• Suggest priority ordering based on deadlines
• Set up automatic reminders for important tasks

⚡ **Quick Actions:**
• Review and update task statuses
• Reschedule overdue items
• Break down large tasks into smaller steps

🔔 **Smart Reminders:**
I can automatically notify you about upcoming deadlines and suggest optimal times to work on specific tasks.`
    }
    
    if (lowerMessage.includes('week') || lowerMessage.includes('summary')) {
      return `Here's your weekly summary:

📊 **This Week's Overview:**
• Task completion rate and patterns
• Time allocation across different categories
• Goal progress and milestones reached

🎯 **Performance Insights:**
• Your most productive time periods
• Areas for improvement
• Habit consistency tracking

📈 **Recommendations:**
Based on your patterns, I suggest optimizing your schedule for better work-life balance and productivity.

Would you like a detailed breakdown of any specific area?`
    }
    
    if (lowerMessage.includes('prioritize') || lowerMessage.includes('priority')) {
      return `Let me help you prioritize effectively:

🎯 **Prioritization Framework:**
1. **Urgent & Important** - Do first
2. **Important but Not Urgent** - Schedule
3. **Urgent but Not Important** - Delegate or minimize
4. **Neither** - Eliminate

⚡ **Smart Suggestions:**
• Focus on high-impact activities
• Consider energy levels throughout the day
• Balance quick wins with long-term goals

🧠 **Decision Factors:**
• Deadlines and dependencies
• Strategic importance
• Resource requirements
• Personal energy and focus levels

What specific areas would you like help prioritizing?`
    }
    
    // Default response
    return `I'm here to help you with your productivity! I can assist with:

🎯 **Daily Focus & Planning**
• Task prioritization
• Schedule optimization
• Goal tracking

📊 **Analytics & Insights**
• Weekly reviews
• Progress summaries
• Performance patterns

⚡ **Smart Reminders**
• Deadline notifications
• Break suggestions
• Focus time recommendations

💡 **Productivity Tips**
• Time management strategies
• Habit formation advice
• Work-life balance tips

What would you like to explore? You can ask me about your tasks, goals, schedule, or request specific productivity advice!`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assistant...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {currentView === 'dashboard' && (
        <AssistantDashboard
          reminders={reminders}
          onDismissReminder={handleDismissReminder}
          onOpenSettings={() => setCurrentView('settings')}
          onStartChat={() => setCurrentView('chat')}
        />
      )}

      {currentView === 'settings' && preferences && (
        <AssistantSettings
          preferences={preferences}
          onSave={handleSavePreferences}
          onClose={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'chat' && (
        <AssistantChat
          conversation={conversation || undefined}
          onSendMessage={handleSendMessage}
          onClose={() => setCurrentView('dashboard')}
        />
      )}
    </div>
  )
}
