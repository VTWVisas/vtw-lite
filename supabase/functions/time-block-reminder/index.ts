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
        job_name: 'time-block-reminder',
        job_type: 'time_block_reminder',
        scheduled_at: new Date().toISOString(),
        status: 'running'
      })

    let usersProcessed = 0
    let notificationsSent = 0
    const startTime = Date.now()

    // Get pending reminders that should be sent now
    const now = new Date()
    const { data: pendingReminders, error: remindersError } = await supabaseClient
      .from('reminders')
      .select(`
        *,
        user_notification_preferences!inner(*)
      `)
      .eq('is_sent', false)
      .in('type', ['time_block_starting', 'task_due'])
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })

    if (remindersError) {
      throw new Error(`Failed to fetch reminders: ${remindersError.message}`)
    }

    // Process each reminder
    for (const reminder of pendingReminders) {
      try {
        await sendReminder(supabaseClient, reminder)
        
        // Mark as sent
        await supabaseClient
          .from('reminders')
          .update({
            is_sent: true,
            sent_at: now.toISOString()
          })
          .eq('id', reminder.id)

        notificationsSent++
        
        // Count unique users
        if (!usersProcessed || reminder.user_id !== pendingReminders[Math.max(0, notificationsSent - 2)]?.user_id) {
          usersProcessed++
        }
      } catch (reminderError) {
        console.error(`Error sending reminder ${reminder.id}:`, reminderError)
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
        remindersProcessed: pendingReminders.length,
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
    console.error('Time block reminder error:', error)
    
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

async function sendReminder(supabase: any, reminder: any) {
  // The reminder is already stored in the database (in-app notification)
  // Here we can send additional notifications based on delivery methods
  
  for (const method of reminder.delivery_methods) {
    switch (method) {
      case 'email':
        if (reminder.user_notification_preferences?.email_address) {
          await sendEmailReminder(reminder)
        }
        break
      
      case 'push':
        if (reminder.user_notification_preferences?.push_subscription) {
          await sendPushNotification(reminder)
        }
        break
      
      case 'telegram':
        if (reminder.user_notification_preferences?.telegram_chat_id) {
          await sendTelegramMessage(reminder)
        }
        break
      
      case 'in_app':
        // Already stored in database, no additional action needed
        break
    }
  }
}

async function sendEmailReminder(reminder: any) {
  // Implement email sending logic here
  // Example using Resend or your preferred email service
  console.log(`Would send email reminder: ${reminder.title}`)
  
  /*
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'VTW Lite Assistant <assistant@vtwlite.com>',
      to: reminder.user_notification_preferences.email_address,
      subject: reminder.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${reminder.title}</h2>
          <p>${reminder.message}</p>
          <hr>
          <p><small>This is an automated reminder from VTW Lite Assistant.</small></p>
        </div>
      `
    })
  })
  */
}

async function sendPushNotification(reminder: any) {
  // Implement web push notification logic here
  console.log(`Would send push notification: ${reminder.title}`)
  
  /*
  const subscription = reminder.user_notification_preferences.push_subscription
  
  await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: subscription.endpoint,
      notification: {
        title: reminder.title,
        body: reminder.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      }
    })
  })
  */
}

async function sendTelegramMessage(reminder: any) {
  // Implement Telegram bot messaging here
  console.log(`Would send Telegram message: ${reminder.title}`)
  
  /*
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = reminder.user_notification_preferences.telegram_chat_id
  
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🔔 ${reminder.title}\n\n${reminder.message}`,
      parse_mode: 'Markdown'
    })
  })
  */
}
