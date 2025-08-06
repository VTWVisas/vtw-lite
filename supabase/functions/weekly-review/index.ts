import { serve } from "https://deno.land/std@0.184.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log job start
    const jobId = crypto.randomUUID()
    await supabaseClient
      .from('scheduled_jobs')
      .insert({
        id: jobId,
        job_name: 'weekly-review',
        job_type: 'weekly_review',
        scheduled_at: new Date().toISOString(),
        status: 'running'
      })

    let usersProcessed = 0
    let notificationsSent = 0
    const startTime = Date.now()

    // Get all users with weekly reviews enabled for today
    const currentDay = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    
    const { data: users, error: usersError } = await supabaseClient
      .from('user_notification_preferences')
      .select(`
        user_id,
        weekly_review_enabled,
        weekly_review_day,
        weekly_review_time,
        weekly_review_methods,
        timezone,
        email_address
      `)
      .eq('weekly_review_enabled', true)
      .eq('weekly_review_day', currentDay)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    // Process each user
    for (const userPrefs of users) {
      try {
        // Check if it's time for this user's weekly review
        const userTime = new Date().toLocaleString("en-US", {
          timeZone: userPrefs.timezone || 'UTC'
        })
        const currentHour = new Date(userTime).getHours()
        const reviewHour = parseInt(userPrefs.weekly_review_time.split(':')[0])

        // Only send if it's within the user's scheduled hour
        if (Math.abs(currentHour - reviewHour) <= 1) {
          const weeklyData = await getUserWeeklyData(supabaseClient, userPrefs.user_id)
          
          if (weeklyData) {
            await sendWeeklyReview(supabaseClient, weeklyData, userPrefs)
            notificationsSent++
          }
        }
        
        usersProcessed++
      } catch (userError) {
        console.error(`Error processing user ${userPrefs.user_id}:`, userError)
      }
    }

    // Update job completion
    const duration = Date.now() - startTime
    await supabaseClient
      .from('scheduled_jobs')
      .update({
        status: 'completed',
        executed_at: new Date().toISOString(),
        users_processed: usersProcessed,
        notifications_sent: notificationsSent,
        execution_duration_ms: duration
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed,
        notificationsSent,
        duration
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Weekly review error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function getUserWeeklyData(supabase: any, userId: string) {
  try {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Go to Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    // Get user info
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    if (!userData.user) return null

    // Get week's completed tasks
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', startOfWeek.toISOString())
      .lt('updated_at', endOfWeek.toISOString())

    // Get week's time blocks
    const { data: timeBlocks } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startOfWeek.toISOString())
      .lt('start_time', endOfWeek.toISOString())
      .order('start_time', { ascending: true })

    // Get week's pomodoro sessions
    const { data: pomodoroSessions } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('started_at', startOfWeek.toISOString())
      .lt('started_at', endOfWeek.toISOString())

    // Get habit completions for the week
    const { data: habitEntries } = await supabase
      .from('habit_entries')
      .select(`
        *,
        habits:habit_id(name, description)
      `)
      .eq('user_id', userId)
      .gte('completed_at', startOfWeek.toISOString().split('T')[0])
      .lt('completed_at', endOfWeek.toISOString().split('T')[0])

    // Get goals progress
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'completed'])

    // Get journal entries for insights
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('mood_rating, content')
      .eq('user_id', userId)
      .gte('date', startOfWeek.toISOString().split('T')[0])
      .lt('date', endOfWeek.toISOString().split('T')[0])

    return {
      id: userId,
      email: userData.user.email,
      weekPeriod: {
        start: startOfWeek,
        end: endOfWeek
      },
      completedTasks: completedTasks || [],
      timeBlocks: timeBlocks || [],
      pomodoroSessions: pomodoroSessions || [],
      habitEntries: habitEntries || [],
      goals: goals || [],
      journalEntries: journalEntries || []
    }
  } catch (error) {
    console.error('Error fetching weekly data:', error)
    return null
  }
}

async function sendWeeklyReview(supabase: any, weeklyData: any, userPrefs: any) {
  const weekStart = weeklyData.weekPeriod.start.toLocaleDateString()
  const weekEnd = weeklyData.weekPeriod.end.toLocaleDateString()
  
  // Create weekly review message
  const message = createWeeklyReviewMessage(weeklyData, weekStart, weekEnd)
  
  // Store in-app notification
  if (userPrefs.weekly_review_methods.includes('in_app')) {
    await supabase
      .from('reminders')
      .insert({
        user_id: weeklyData.id,
        title: `Weekly Review - ${weekStart} to ${weekEnd}`,
        message: message,
        type: 'weekly_review',
        scheduled_for: new Date().toISOString(),
        is_sent: true,
        sent_at: new Date().toISOString(),
        delivery_methods: ['in_app']
      })
  }

  // Send email if enabled
  if (userPrefs.weekly_review_methods.includes('email') && userPrefs.email_address) {
    console.log(`Would send weekly review email to: ${userPrefs.email_address}`)
  }
}

function createWeeklyReviewMessage(weeklyData: any, weekStart: string, weekEnd: string): string {
  let message = `🗓️ **Weekly Review** (${weekStart} - ${weekEnd})\n\n`

  // Productivity Summary
  message += `📊 **Productivity Summary**\n`
  message += `• Tasks Completed: ${weeklyData.completedTasks.length}\n`
  message += `• Time Blocks Scheduled: ${weeklyData.timeBlocks.length}\n`
  message += `• Pomodoro Sessions: ${weeklyData.pomodoroSessions.length}\n`
  
  if (weeklyData.pomodoroSessions.length > 0) {
    const totalFocusTime = weeklyData.pomodoroSessions.reduce((sum: number, session: any) => 
      sum + (session.duration_minutes || 25), 0)
    message += `• Total Focus Time: ${Math.round(totalFocusTime / 60 * 10) / 10} hours\n`
  }
  message += '\n'

  // Top Achievements
  if (weeklyData.completedTasks.length > 0) {
    message += `🏆 **Top Achievements**\n`
    const importantTasks = weeklyData.completedTasks
      .filter((task: any) => task.priority === 'high' || task.priority === 'urgent')
      .slice(0, 3)
    
    if (importantTasks.length > 0) {
      importantTasks.forEach((task: any) => {
        message += `• ${task.title}\n`
      })
    } else {
      weeklyData.completedTasks.slice(0, 3).forEach((task: any) => {
        message += `• ${task.title}\n`
      })
    }
    message += '\n'
  }

  // Habits Tracking
  if (weeklyData.habitEntries.length > 0) {
    message += `🎯 **Habit Performance**\n`
    const habitStats = weeklyData.habitEntries.reduce((acc: any, entry: any) => {
      const habitName = entry.habits?.name || 'Unknown Habit'
      acc[habitName] = (acc[habitName] || 0) + 1
      return acc
    }, {})

    Object.entries(habitStats).forEach(([habit, count]) => {
      const percentage = Math.round((count as number) / 7 * 100)
      message += `• ${habit}: ${count}/7 days (${percentage}%)\n`
    })
    message += '\n'
  }

  // Mood Analysis
  if (weeklyData.journalEntries.length > 0) {
    const avgMood = weeklyData.journalEntries
      .filter((entry: any) => entry.mood_rating)
      .reduce((sum: number, entry: any) => sum + entry.mood_rating, 0) / 
      weeklyData.journalEntries.filter((entry: any) => entry.mood_rating).length

    if (avgMood) {
      message += `😊 **Well-being**\n`
      message += `• Average Mood: ${avgMood.toFixed(1)}/5\n`
      message += `• Journal Entries: ${weeklyData.journalEntries.length}\n`
      
      const moodEmoji = avgMood >= 4.5 ? '😄' : avgMood >= 3.5 ? '😊' : avgMood >= 2.5 ? '😐' : '😔'
      message += `• Overall feeling: ${moodEmoji}\n\n`
    }
  }

  // Goals Progress
  const activeGoals = weeklyData.goals.filter((goal: any) => goal.status === 'active')
  if (activeGoals.length > 0) {
    message += `🎖️ **Goals Progress**\n`
    activeGoals.slice(0, 3).forEach((goal: any) => {
      const progress = goal.progress_percentage || 0
      const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10))
      message += `• ${goal.title}: ${progressBar} ${progress}%\n`
    })
    message += '\n'
  }

  // Insights and Recommendations
  message += `💡 **Insights for Next Week**\n`
  
  if (weeklyData.completedTasks.length === 0) {
    message += `• Focus on completing at least 3 tasks this week\n`
  } else if (weeklyData.completedTasks.length < 5) {
    message += `• Great start! Try to complete ${weeklyData.completedTasks.length + 2} tasks next week\n`
  } else {
    message += `• Excellent productivity! You completed ${weeklyData.completedTasks.length} tasks\n`
  }

  if (weeklyData.pomodoroSessions.length < 5) {
    message += `• Consider using Pomodoro technique for better focus\n`
  }

  if (weeklyData.habitEntries.length === 0) {
    message += `• Start tracking your daily habits for better consistency\n`
  }

  message += '\nKeep up the great work! 🚀'

  return message
}
