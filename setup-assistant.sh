#!/bin/bash

# Smart Assistant Setup Script for Supabase
# This script sets up the necessary cron jobs and configurations

echo "🤖 Setting up VTW Lite Smart Assistant..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Apply the migration
echo "📊 Applying Smart Assistant database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database migration applied successfully"
else
    echo "❌ Failed to apply database migration"
    exit 1
fi

# Deploy Edge Functions
echo "🚀 Deploying Edge Functions..."

# Deploy daily reminder function
echo "   Deploying daily-reminder function..."
supabase functions deploy daily-reminder

# Deploy weekly review function
echo "   Deploying weekly-review function..."
supabase functions deploy weekly-review

# Deploy time block reminder function
echo "   Deploying time-block-reminder function..."
supabase functions deploy time-block-reminder

if [ $? -eq 0 ]; then
    echo "✅ Edge Functions deployed successfully"
else
    echo "❌ Failed to deploy Edge Functions"
    exit 1
fi

# Setup cron jobs using pg_cron (if available)
echo "⏰ Setting up cron jobs..."

# Note: These would need to be run in your Supabase SQL editor or via the CLI
cat << 'EOF' > setup_cron_jobs.sql
-- Setup pg_cron jobs for Smart Assistant
-- Run these commands in your Supabase SQL editor

-- Daily reminder at 7:00 AM UTC (runs every day)
SELECT cron.schedule(
    'daily-assistant-reminder',
    '0 7 * * *',  -- Every day at 7:00 AM
    $$
    SELECT
      net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/daily-reminder',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
    $$
);

-- Weekly review on Sundays at 6:00 PM UTC
SELECT cron.schedule(
    'weekly-assistant-review',
    '0 18 * * 0',  -- Every Sunday at 6:00 PM
    $$
    SELECT
      net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/weekly-review',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
    $$
);

-- Time block reminders every 15 minutes
SELECT cron.schedule(
    'time-block-reminders',
    '*/15 * * * *',  -- Every 15 minutes
    $$
    SELECT
      net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/time-block-reminder',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
    $$
);

-- Check cron jobs
SELECT * FROM cron.job;
EOF

echo "📄 Cron job setup SQL generated in 'setup_cron_jobs.sql'"
echo "   Please run these commands in your Supabase SQL editor to activate cron jobs."

# Create environment variables template
cat << 'EOF' > .env.assistant.example
# Smart Assistant Environment Variables
# Copy to your .env.local file

# AI/OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Email Service (Resend example)
RESEND_API_KEY=your_resend_api_key_here

# Push Notifications (FCM)
FCM_SERVER_KEY=your_fcm_server_key_here

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Supabase Configuration (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
EOF

echo "📄 Environment variables template created: .env.assistant.example"

# Instructions for manual setup
echo ""
echo "🎉 Smart Assistant setup complete!"
echo ""
echo "📋 Manual steps to complete:"
echo "1. Copy environment variables from .env.assistant.example to your .env.local"
echo "2. Run the SQL commands from setup_cron_jobs.sql in your Supabase SQL editor"
echo "3. Update the URLs in the cron jobs to match your project"
echo "4. Test the assistant in your application at /assistant"
echo ""
echo "🔧 Optional integrations:"
echo "• Set up OpenAI API key for enhanced AI responses"
echo "• Configure Resend for email notifications"
echo "• Set up FCM for push notifications"
echo "• Create a Telegram bot for mobile notifications"
echo ""
echo "📖 Documentation:"
echo "• Daily reminders: Sent at user's preferred time"
echo "• Weekly reviews: Sent on user's preferred day"
echo "• Time block reminders: 15 minutes before scheduled blocks"
echo "• Task reminders: Configurable hours before due date"
echo ""
echo "✨ Your Smart Assistant is ready to boost productivity!"
