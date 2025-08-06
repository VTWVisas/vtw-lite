# 🤖 Smart Assistant Module

A comprehensive AI-powered productivity assistant for your VTW Lite application that provides intelligent reminders, analytics, and conversational assistance.

## 🎯 Features

### ⏰ Automated Reminders
- **Daily Summary**: Morning briefings with tasks, schedule, and priorities
- **Weekly Reviews**: Comprehensive productivity analysis every Sunday
- **Task Deadlines**: Smart notifications before due dates
- **Time Block Alerts**: Reminders before scheduled activities
- **Break Suggestions**: Automated wellness reminders
- **Pomodoro Prompts**: Focus session recommendations

### 🧠 AI Chat Assistant
- **Contextual Intelligence**: Understands your productivity patterns
- **Natural Queries**: Ask questions in plain English
- **Smart Insights**: Data-driven productivity recommendations
- **Goal Tracking**: Progress analysis and milestone suggestions
- **Performance Analytics**: Weekly and monthly summaries

### 📱 Multi-Channel Notifications
- **In-App Toasts**: Real-time browser notifications
- **Email Alerts**: Scheduled summaries and urgent reminders
- **Push Notifications**: Mobile-ready web push
- **Telegram Bot**: Optional mobile messaging (coming soon)

## 🏗️ Architecture

### Database Schema
```sql
-- Core Tables
reminders              -- Notification queue and history
user_notification_preferences  -- Per-user settings
assistant_conversations       -- Chat history
assistant_messages           -- Individual chat messages
scheduled_jobs              -- Cron job tracking
```

### Edge Functions (Supabase)
```bash
/supabase/functions/
├── daily-reminder/     # Morning summaries (7:00 AM)
├── weekly-review/      # Sunday reviews (6:00 PM)
└── time-block-reminder/ # 15-minute intervals
```

### Frontend Components
```bash
/src/app/(lite)/assistant/
├── page.tsx                 # Main assistant interface
└── components/
    ├── AssistantDashboard.tsx  # Overview and reminders
    ├── AssistantSettings.tsx   # Notification preferences
    └── AssistantChat.tsx       # AI conversation interface
```

## 🚀 Quick Start

### 1. Database Setup
```bash
# Apply the Smart Assistant migration
supabase db push

# Or manually run the migration
psql -f supabase/migrations/003_smart_assistant_module.sql
```

### 2. Edge Functions Deployment
```bash
# Deploy all assistant functions
supabase functions deploy daily-reminder
supabase functions deploy weekly-review
supabase functions deploy time-block-reminder
```

### 3. Cron Jobs Setup
Run the following SQL in your Supabase SQL editor:

```sql
-- Daily reminders at 7:00 AM UTC
SELECT cron.schedule(
    'daily-assistant-reminder',
    '0 7 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/daily-reminder',
        headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
    $$
);

-- Weekly reviews on Sundays at 6:00 PM UTC
SELECT cron.schedule(
    'weekly-assistant-review',
    '0 18 * * 0',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/weekly-review',
        headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
    $$
);

-- Time block reminders every 15 minutes
SELECT cron.schedule(
    'time-block-reminders',
    '*/15 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/time-block-reminder',
        headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
    $$
);
```

### 4. Environment Variables
Add these to your `.env.local`:

```bash
# Optional: Enhanced AI responses
OPENAI_API_KEY=your_openai_key_here

# Optional: Email notifications
RESEND_API_KEY=your_resend_key_here

# Optional: Push notifications
FCM_SERVER_KEY=your_fcm_key_here

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## 📊 Usage Examples

### Setting Up User Preferences
```typescript
const preferences = {
  daily_summary_enabled: true,
  daily_summary_time: '07:00',
  daily_summary_methods: ['in_app', 'email'],
  
  weekly_review_enabled: true,
  weekly_review_day: 0, // Sunday
  weekly_review_time: '18:00',
  
  task_reminders_enabled: true,
  task_reminder_advance_hours: 24,
  
  time_block_reminders_enabled: true,
  time_block_reminder_advance_minutes: 15
}
```

### AI Chat Queries
```javascript
// Ask the assistant anything about your productivity
"What's my focus for today?"
"How are my goals progressing?"
"What tasks are overdue?"
"Summarize my week"
"Help me prioritize my tasks"
"When should I take a break?"
```

### Programmatic Reminder Creation
```typescript
// Create a custom reminder
await supabase.from('reminders').insert({
  user_id: userId,
  title: 'Project Deadline',
  message: 'Your project proposal is due tomorrow!',
  type: 'deadline_warning',
  priority: 'urgent',
  scheduled_for: new Date().toISOString(),
  delivery_methods: ['in_app', 'email']
})
```

## 🎨 Customization

### Adding New Reminder Types
1. **Update the enum** in the database schema:
```sql
ALTER TYPE reminder_type ADD VALUE 'custom_reminder';
```

2. **Handle in Edge Functions**:
```typescript
// Add logic in your Edge Function
if (reminder.type === 'custom_reminder') {
  // Custom processing logic
}
```

3. **Update Frontend Components**:
```typescript
const typeIcons = {
  // ... existing types
  custom_reminder: CustomIcon
}
```

### Enhanced AI Integration
Replace the placeholder AI logic with OpenAI integration:

```typescript
// In /api/assistant/chat/route.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: `You are a productivity assistant. User context: ${JSON.stringify(userContext)}`
    },
    {
      role: "user", 
      content: message
    }
  ],
})
```

### Custom Notification Channels
Add new delivery methods:

```typescript
// Slack integration example
async function sendSlackNotification(reminder: Reminder) {
  await fetch('https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK', {
    method: 'POST',
    body: JSON.stringify({
      text: `🔔 ${reminder.title}\n${reminder.message}`
    })
  })
}
```

## 📈 Analytics & Monitoring

### Performance Metrics
- **Notification Delivery Rate**: Track successful sends
- **User Engagement**: Monitor which reminders are most effective
- **AI Chat Usage**: Analyze popular queries and response quality
- **Cron Job Health**: Monitor scheduled task execution

### Database Queries for Analytics
```sql
-- Most popular reminder types
SELECT type, COUNT(*) as count 
FROM reminders 
GROUP BY type 
ORDER BY count DESC;

-- User engagement with reminders
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_reminders,
  COUNT(*) FILTER (WHERE is_sent = true) as sent_reminders
FROM reminders 
GROUP BY DATE(created_at);

-- AI chat activity
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT conversation_id) as conversations,
  COUNT(*) as total_messages
FROM assistant_messages 
GROUP BY DATE(created_at);
```

## 🔧 Troubleshooting

### Common Issues

**Cron jobs not running:**
```sql
-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- View cron job status
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

**Edge Functions not responding:**
```bash
# Check function logs
supabase functions logs daily-reminder

# Test function manually
curl -X POST https://your-project.supabase.co/functions/v1/daily-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Database connection issues:**
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Performance Optimization

**Index Creation:**
```sql
-- Optimize reminder queries
CREATE INDEX idx_reminders_user_scheduled 
ON reminders(user_id, scheduled_for, is_sent);

-- Optimize chat queries  
CREATE INDEX idx_messages_conversation_time
ON assistant_messages(conversation_id, created_at DESC);
```

**Batch Processing:**
```typescript
// Process reminders in batches
const batchSize = 100
for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize)
  await Promise.all(batch.map(user => processUserReminders(user)))
}
```

## 🚦 Future Enhancements

### Planned Features
- [ ] **Voice Commands**: Speech-to-text AI interactions
- [ ] **Calendar Integration**: Google/Outlook calendar sync
- [ ] **Team Collaboration**: Shared goals and accountability
- [ ] **Advanced Analytics**: ML-powered productivity insights
- [ ] **Mobile App**: React Native companion app
- [ ] **Habit Predictions**: AI-powered habit recommendations
- [ ] **Smart Scheduling**: Automatic time block optimization

### Integration Opportunities
- [ ] **Zapier/IFTTT**: Workflow automation
- [ ] **Notion/Obsidian**: Knowledge management sync
- [ ] **GitHub**: Developer productivity tracking
- [ ] **Fitness Apps**: Holistic wellness integration
- [ ] **Finance Apps**: Expense/income correlation analysis

## 📝 Contributing

### Development Setup
```bash
# Clone and setup
git clone <repository>
cd vtw-lite
npm install

# Start development
npm run dev

# Run assistant setup
chmod +x setup-assistant.sh
./setup-assistant.sh
```

### Testing
```bash
# Test Edge Functions locally
supabase functions serve

# Test reminder creation
curl -X POST http://localhost:54321/functions/v1/daily-reminder
```

## 📄 License

This Smart Assistant module is part of the VTW Lite project and follows the same license terms.

---

**Built with ❤️ for productivity enthusiasts**

Need help? Open an issue or contact the development team.
