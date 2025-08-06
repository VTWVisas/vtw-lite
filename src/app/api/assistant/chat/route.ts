import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data for context
    const userContext = await getUserContext(supabase, user.id)
    
    // Generate AI response based on message and user context
    const aiResponse = await generateContextualResponse(message, userContext)

    // Store the conversation if conversationId is provided
    if (conversationId) {
      // Add user message
      await supabase
        .from('assistant_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message
        })

      // Add assistant response
      await supabase
        .from('assistant_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse
        })
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Assistant API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getUserContext(supabase: any, userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Get user's recent data for context
  const [
    { data: tasks },
    { data: timeBlocks },
    { data: goals },
    { data: habits },
    { data: pomodoroSessions },
    { data: journalEntries }
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', today)
      .order('start_time', { ascending: true }),
    
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active'),
    
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true),
    
    supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', weekAgo),
    
    supabase
      .from('journal_entries')
      .select('mood_rating, date')
      .eq('user_id', userId)
      .gte('date', weekAgo)
  ])

  return {
    tasks: tasks || [],
    timeBlocks: timeBlocks || [],
    goals: goals || [],
    habits: habits || [],
    pomodoroSessions: pomodoroSessions || [],
    journalEntries: journalEntries || []
  }
}

async function generateContextualResponse(message: string, context: any): Promise<string> {
  const lowerMessage = message.toLowerCase()
  
  // Analyze user context
  const stats = {
    totalTasks: context.tasks.length,
    completedTasks: context.tasks.filter((t: any) => t.status === 'completed').length,
    overdueTasks: context.tasks.filter((t: any) => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length,
    todayBlocks: context.timeBlocks.filter((b: any) => 
      new Date(b.start_time).toDateString() === new Date().toDateString()
    ).length,
    activeGoals: context.goals.length,
    pomodoroSessions: context.pomodoroSessions.length,
    avgMood: context.journalEntries.length > 0 
      ? context.journalEntries.reduce((sum: number, entry: any) => sum + (entry.mood_rating || 0), 0) / context.journalEntries.length
      : null
  }

  // Focus/Today queries
  if (lowerMessage.includes('focus') || lowerMessage.includes('today')) {
    let response = `🎯 **Your Focus for Today:**\n\n`

    if (stats.overdueTasks > 0) {
      response += `⚠️ **Priority Alert:** You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''}. I recommend addressing these first.\n\n`
    }

    if (stats.todayBlocks > 0) {
      response += `📅 **Today's Schedule:** You have ${stats.todayBlocks} time block${stats.todayBlocks > 1 ? 's' : ''} scheduled. `
      const nextBlock = context.timeBlocks[0]
      if (nextBlock) {
        const nextTime = new Date(nextBlock.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        response += `Your next block "${nextBlock.title}" starts at ${nextTime}.\n\n`
      }
    }

    const urgentTasks = context.tasks.filter((t: any) => t.priority === 'urgent' && t.status !== 'completed')
    if (urgentTasks.length > 0) {
      response += `🔥 **Urgent Tasks:**\n`
      urgentTasks.slice(0, 3).forEach((task: any) => {
        response += `• ${task.title}\n`
      })
      response += '\n'
    }

    response += `💡 **Recommendation:** Start with your highest priority tasks during your peak energy hours. Consider using the Pomodoro technique for better focus.`

    return response
  }

  // Goals progress
  if (lowerMessage.includes('goal') || lowerMessage.includes('progress')) {
    let response = `🎖️ **Goal Progress Overview:**\n\n`

    if (stats.activeGoals === 0) {
      response += `You don't have any active goals set up yet. Setting clear goals can significantly improve your productivity and motivation!\n\n`
      response += `💡 **Suggestion:** Start by setting 1-3 SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound).`
    } else {
      response += `📊 **Active Goals:** ${stats.activeGoals}\n\n`
      
      context.goals.slice(0, 3).forEach((goal: any) => {
        const progress = goal.progress_percentage || 0
        const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10))
        const daysLeft = goal.target_date 
          ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
        
        response += `🎯 **${goal.title}**\n`
        response += `   Progress: ${progressBar} ${progress}%\n`
        if (daysLeft !== null) {
          response += `   Time left: ${daysLeft > 0 ? `${daysLeft} days` : 'Overdue'}\n`
        }
        response += '\n'
      })

      response += `💡 **Tip:** Break down large goals into smaller, weekly milestones for better tracking and motivation.`
    }

    return response
  }

  // Task queries
  if (lowerMessage.includes('task') || lowerMessage.includes('overdue')) {
    let response = `📋 **Task Overview:**\n\n`
    
    response += `📊 **Summary:**\n`
    response += `• Total tasks: ${stats.totalTasks}\n`
    response += `• Completed: ${stats.completedTasks}\n`
    response += `• Overdue: ${stats.overdueTasks}\n\n`

    if (stats.overdueTasks > 0) {
      response += `⚠️ **Overdue Tasks:** ${stats.overdueTasks}\n`
      const overdue = context.tasks.filter((t: any) => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
      )
      overdue.slice(0, 5).forEach((task: any) => {
        const daysPast = Math.ceil((Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
        response += `• ${task.title} (${daysPast} day${daysPast > 1 ? 's' : ''} overdue)\n`
      })
      response += '\n'
    }

    const upcomingTasks = context.tasks.filter((t: any) => 
      t.due_date && new Date(t.due_date) > new Date() && t.status !== 'completed'
    ).slice(0, 3)

    if (upcomingTasks.length > 0) {
      response += `📅 **Upcoming Deadlines:**\n`
      upcomingTasks.forEach((task: any) => {
        const daysLeft = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        response += `• ${task.title} (${daysLeft} day${daysLeft > 1 ? 's' : ''} left)\n`
      })
    }

    return response
  }

  // Weekly summary
  if (lowerMessage.includes('week') || lowerMessage.includes('summary')) {
    let response = `📊 **Weekly Summary:**\n\n`

    response += `🎯 **Productivity Stats:**\n`
    response += `• Tasks completed: ${stats.completedTasks}\n`
    response += `• Pomodoro sessions: ${stats.pomodoroSessions}\n`
    response += `• Active goals: ${stats.activeGoals}\n`
    
    if (stats.avgMood) {
      const moodEmoji = stats.avgMood >= 4 ? '😄' : stats.avgMood >= 3 ? '😊' : stats.avgMood >= 2 ? '😐' : '😔'
      response += `• Average mood: ${stats.avgMood.toFixed(1)}/5 ${moodEmoji}\n`
    }
    response += '\n'

    const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100) : 0
    response += `📈 **Performance:**\n`
    response += `• Task completion rate: ${completionRate.toFixed(1)}%\n`
    
    if (completionRate >= 80) {
      response += `🌟 Excellent! You're staying on top of your tasks.\n`
    } else if (completionRate >= 60) {
      response += `👍 Good progress! Consider prioritizing remaining tasks.\n`
    } else {
      response += `💡 Tip: Focus on completing smaller tasks first to build momentum.\n`
    }

    response += '\n💪 **Keep up the great work!**'

    return response
  }

  // Prioritization help
  if (lowerMessage.includes('prioritize') || lowerMessage.includes('priority')) {
    let response = `🎯 **Smart Prioritization:**\n\n`

    if (stats.overdueTasks > 0) {
      response += `🔥 **Start Here:** Address your ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''} first.\n\n`
    }

    response += `📋 **Eisenhower Matrix:**\n`
    response += `1. **Urgent & Important** → Do First\n`
    response += `2. **Important, Not Urgent** → Schedule\n`
    response += `3. **Urgent, Not Important** → Delegate\n`
    response += `4. **Neither** → Eliminate\n\n`

    const highPriorityTasks = context.tasks.filter((t: any) => 
      (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed'
    )

    if (highPriorityTasks.length > 0) {
      response += `⚡ **Your High Priority Tasks:**\n`
      highPriorityTasks.slice(0, 5).forEach((task: any) => {
        response += `• ${task.title} (${task.priority})\n`
      })
      response += '\n'
    }

    response += `💡 **Pro Tip:** Tackle your most challenging task when your energy is highest!`

    return response
  }

  // Default contextual response
  let response = `Hello! I'm your AI productivity assistant. Here's what I can help you with:\n\n`

  response += `📊 **Quick Overview:**\n`
  response += `• You have ${stats.totalTasks} total tasks (${stats.completedTasks} completed)\n`
  if (stats.overdueTasks > 0) {
    response += `• ⚠️ ${stats.overdueTasks} task${stats.overdueTasks > 1 ? 's' : ''} overdue\n`
  }
  if (stats.todayBlocks > 0) {
    response += `• 📅 ${stats.todayBlocks} time block${stats.todayBlocks > 1 ? 's' : ''} scheduled today\n`
  }
  response += `• 🎯 ${stats.activeGoals} active goal${stats.activeGoals !== 1 ? 's' : ''}\n\n`

  response += `💬 **Ask me about:**\n`
  response += `• "What's my focus for today?"\n`
  response += `• "How are my goals progressing?"\n`
  response += `• "What tasks are overdue?"\n`
  response += `• "Summarize my week"\n`
  response += `• "Help me prioritize"\n\n`

  response += `🚀 I'm here to help you stay productive and achieve your goals!`

  return response
}
