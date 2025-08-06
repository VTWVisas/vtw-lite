import { serve } from "https://deno.land/std@0.184.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserData {
  id: string
  email: string
  preferences: any
  tasks: any[]
  timeBlocks: any[]
  habits: any[]
  goals: any[]
}

serve(async (req) => {
  // Handle CORS
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
        job_name: 'daily-reminder',
        job_type: 'daily_reminder',
        scheduled_at: new Date().toISOString(),
        status: 'running'
      })

    let usersProcessed = 0
    let notificationsSent = 0
    const startTime = Date.now()

    // Get all users with daily reminders enabled
    const { data: users, error: usersError } = await supabaseClient
      .from('user_notification_preferences')
      .select(`
        user_id,
        daily_summary_enabled,
        daily_summary_time,
        daily_summary_methods,
        timezone,
        email_address
      `)
      .eq('daily_summary_enabled', true)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    // Process each user
    for (const userPrefs of users) {
      try {
        // Check if it's time for this user's daily reminder
        const userTime = new Date().toLocaleString("en-US", {
          timeZone: userPrefs.timezone || 'UTC'
        })
        const currentHour = new Date(userTime).getHours()
        const reminderHour = parseInt(userPrefs.daily_summary_time.split(':')[0])

        // Only send if it's within the user's scheduled hour
        if (Math.abs(currentHour - reminderHour) <= 1) {
          const userData = await getUserDailyData(supabaseClient, userPrefs.user_id)
          
          if (userData) {
            await sendDailyReminder(supabaseClient, userData, userPrefs)
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
    console.error('Daily reminder error:', error)
    
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

async function getUserDailyData(supabase: any, userId: string): Promise<UserData | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get user info
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    if (!userData.user) return null

    // Get today's and tomorrow's tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['todo', 'in_progress'])
      .or(`due_date.gte.${today},due_date.lte.${tomorrow}`)
      .order('due_date', { ascending: true })

    // Get today's time blocks
    const { data: timeBlocks } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', `${today}T00:00:00Z`)
      .lt('start_time', `${tomorrow}T00:00:00Z`)
      .order('start_time', { ascending: true })

    // Get active habits
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    // Get active goals with approaching deadlines
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .lte('target_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())

    return {
      id: userId,
      email: userData.user.email,
      preferences: null,
      tasks: tasks || [],
      timeBlocks: timeBlocks || [],
      habits: habits || [],
      goals: goals || []
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

async function sendDailyReminder(supabase: any, userData: UserData, userPrefs: any) {
  const today = new Date().toLocaleDateString()
  
  // Create reminder message
  const message = createDailyReminderMessage(userData, today)
  
  // Store in-app notification
  if (userPrefs.daily_summary_methods.includes('in_app')) {
    await supabase
      .from('reminders')
      .insert({
        user_id: userData.id,
        title: `Daily Summary - ${today}`,
        message: message,
        type: 'daily_summary',
        scheduled_for: new Date().toISOString(),
        is_sent: true,
        sent_at: new Date().toISOString(),
        delivery_methods: ['in_app']
      })
  }

  // Send email if enabled and email address is available
  if (userPrefs.daily_summary_methods.includes('email') && userPrefs.email_address) {
    // Note: You would integrate with your email service here (Resend, SendGrid, etc.)
    console.log(`Would send email to: ${userPrefs.email_address}`)
    
    // Example using Resend (you'd need to install and configure)
    /*
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'VTW Lite Assistant <assistant@vtwlite.com>',
        to: userPrefs.email_address,
        subject: `Daily Summary - ${today}`,
        html: formatEmailTemplate(message, userData)
      })
    })
    */
  }
}

function createDailyReminderMessage(userData: UserData, today: string): string {
  let message = `Good morning! Here's your daily summary for ${today}:\n\n`

  // Tasks section
  if (userData.tasks.length > 0) {
    message += `📋 **Tasks (${userData.tasks.length})**\n`
    userData.tasks.slice(0, 5).forEach(task => {
      const dueText = task.due_date ? ` (Due: ${new Date(task.due_date).toLocaleDateString()})` : ''
      const priorityEmoji = task.priority === 'urgent' ? '🔥 ' : task.priority === 'high' ? '⚡ ' : ''
      message += `• ${priorityEmoji}${task.title}${dueText}\n`
    })
    if (userData.tasks.length > 5) {
      message += `• ... and ${userData.tasks.length - 5} more\n`
    }
    message += '\n'
  }

  // Time blocks section
  if (userData.timeBlocks.length > 0) {
    message += `⏰ **Today's Schedule (${userData.timeBlocks.length} blocks)**\n`
    userData.timeBlocks.slice(0, 5).forEach(block => {
      const startTime = new Date(block.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const endTime = new Date(block.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      message += `• ${startTime}-${endTime}: ${block.title}\n`
    })
    if (userData.timeBlocks.length > 5) {
      message += `• ... and ${userData.timeBlocks.length - 5} more\n`
    }
    message += '\n'
  }

  // Habits section
  if (userData.habits.length > 0) {
    message += `🎯 **Active Habits (${userData.habits.length})**\n`
    userData.habits.slice(0, 3).forEach(habit => {
      message += `• ${habit.name} (${habit.current_streak} day streak)\n`
    })
    message += '\n'
  }

  // Goals section
  if (userData.goals.length > 0) {
    message += `🎖️ **Upcoming Goal Deadlines**\n`
    userData.goals.forEach(goal => {
      const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      message += `• ${goal.title} (${daysLeft} days left) - ${goal.progress_percentage}% complete\n`
    })
    message += '\n'
  }

  message += `💪 **Focus for Today:**\n`
  if (userData.tasks.length > 0) {
    const priorityTask = userData.tasks.find(t => t.priority === 'urgent') || userData.tasks[0]
    message += `Start with: "${priorityTask.title}"\n`
  }
  
  if (userData.timeBlocks.length > 0) {
    const nextBlock = userData.timeBlocks[0]
    const nextTime = new Date(nextBlock.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    message += `Next scheduled: ${nextBlock.title} at ${nextTime}\n`
  }

  message += '\nHave a productive day! 🚀'

  return message
}
