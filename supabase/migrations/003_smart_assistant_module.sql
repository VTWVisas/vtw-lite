-- Smart Assistant Module Schema
-- Created: 2025-08-05

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reminders/Notifications table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'daily_summary', 'weekly_review', 'task_due', 'time_block_starting', 
        'pomodoro_reminder', 'habit_reminder', 'deadline_warning', 'break_suggestion'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_methods TEXT[] DEFAULT '{"in_app"}', -- in_app, email, push, telegram
    
    -- Related entity references (optional)
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    time_block_id UUID REFERENCES public.time_blocks(id) ON DELETE CASCADE,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Daily reminders
    daily_summary_enabled BOOLEAN DEFAULT TRUE,
    daily_summary_time TIME DEFAULT '07:00:00',
    daily_summary_methods TEXT[] DEFAULT '{"in_app", "email"}',
    
    -- Weekly reviews
    weekly_review_enabled BOOLEAN DEFAULT TRUE,
    weekly_review_day INTEGER DEFAULT 0 CHECK (weekly_review_day >= 0 AND weekly_review_day <= 6), -- 0 = Sunday
    weekly_review_time TIME DEFAULT '18:00:00',
    weekly_review_methods TEXT[] DEFAULT '{"in_app", "email"}',
    
    -- Task reminders
    task_reminders_enabled BOOLEAN DEFAULT TRUE,
    task_reminder_advance_hours INTEGER DEFAULT 24,
    task_reminder_methods TEXT[] DEFAULT '{"in_app"}',
    
    -- Time block reminders
    time_block_reminders_enabled BOOLEAN DEFAULT TRUE,
    time_block_reminder_advance_minutes INTEGER DEFAULT 15,
    time_block_reminder_methods TEXT[] DEFAULT '{"in_app"}',
    
    -- Pomodoro suggestions
    pomodoro_suggestions_enabled BOOLEAN DEFAULT TRUE,
    pomodoro_suggestion_interval_hours INTEGER DEFAULT 2,
    
    -- Break reminders
    break_reminders_enabled BOOLEAN DEFAULT TRUE,
    break_reminder_interval_minutes INTEGER DEFAULT 90,
    
    -- Contact preferences
    email_address TEXT,
    telegram_chat_id TEXT,
    push_subscription JSONB,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assistant conversations (for AI chat feature)
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assistant messages
CREATE TABLE IF NOT EXISTS public.assistant_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.assistant_conversations(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Can store token count, model used, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Scheduled jobs tracking (for monitoring cron execution)
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
        'daily_reminder', 'weekly_review', 'time_block_reminder', 
        'task_reminder', 'habit_reminder', 'break_reminder'
    )),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    users_processed INTEGER DEFAULT 0,
    notifications_sent INTEGER DEFAULT 0,
    execution_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminders
CREATE POLICY "Users can view their own reminders" ON public.reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON public.reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON public.reminders
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification preferences
CREATE POLICY "Users can view their own notification preferences" ON public.user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification preferences" ON public.user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON public.user_notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" ON public.user_notification_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assistant conversations
CREATE POLICY "Users can view their own conversations" ON public.assistant_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.assistant_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.assistant_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.assistant_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assistant messages
CREATE POLICY "Users can view their own messages" ON public.assistant_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assistant_conversations ac 
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own messages" ON public.assistant_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assistant_conversations ac 
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );

-- RLS Policies for scheduled jobs (admin/system access only)
CREATE POLICY "System can manage scheduled jobs" ON public.scheduled_jobs
    FOR ALL USING (
        -- Allow service role or specific admin users
        auth.role() = 'service_role' OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- Create indexes for better performance
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_scheduled_for ON public.reminders(scheduled_for);
CREATE INDEX idx_reminders_is_sent ON public.reminders(is_sent);
CREATE INDEX idx_reminders_type ON public.reminders(type);
CREATE INDEX idx_reminders_user_scheduled ON public.reminders(user_id, scheduled_for, is_sent);

CREATE INDEX idx_notification_preferences_user_id ON public.user_notification_preferences(user_id);

CREATE INDEX idx_assistant_conversations_user_id ON public.assistant_conversations(user_id);
CREATE INDEX idx_assistant_conversations_updated_at ON public.assistant_conversations(updated_at DESC);

CREATE INDEX idx_assistant_messages_conversation_id ON public.assistant_messages(conversation_id);
CREATE INDEX idx_assistant_messages_created_at ON public.assistant_messages(created_at);

CREATE INDEX idx_scheduled_jobs_status ON public.scheduled_jobs(status);
CREATE INDEX idx_scheduled_jobs_scheduled_at ON public.scheduled_jobs(scheduled_at);
CREATE INDEX idx_scheduled_jobs_job_type ON public.scheduled_jobs(job_type);

-- Functions for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_assistant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();

CREATE TRIGGER update_assistant_conversations_updated_at BEFORE UPDATE ON public.assistant_conversations
    FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default preferences when a new user signs up
CREATE TRIGGER create_user_notification_preferences 
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Utility function to get user timezone
CREATE OR REPLACE FUNCTION get_user_timezone(user_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_tz VARCHAR;
BEGIN
    SELECT timezone INTO user_tz 
    FROM public.user_notification_preferences 
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_tz, 'UTC');
END;
$$ language 'plpgsql';

-- Function to schedule reminders for tasks with due dates
CREATE OR REPLACE FUNCTION schedule_task_reminders()
RETURNS TRIGGER AS $$
DECLARE
    user_prefs RECORD;
    reminder_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only process if due_date is set and task is not completed
    IF NEW.due_date IS NOT NULL AND NEW.status != 'completed' THEN
        -- Get user preferences
        SELECT * INTO user_prefs 
        FROM public.user_notification_preferences 
        WHERE user_id = NEW.user_id;
        
        -- Only create reminder if user has task reminders enabled
        IF user_prefs.task_reminders_enabled THEN
            -- Calculate reminder time
            reminder_time := NEW.due_date - INTERVAL '1 hour' * COALESCE(user_prefs.task_reminder_advance_hours, 24);
            
            -- Delete existing reminders for this task
            DELETE FROM public.reminders 
            WHERE task_id = NEW.id AND type = 'task_due';
            
            -- Create new reminder
            INSERT INTO public.reminders (
                user_id, title, message, type, scheduled_for, 
                delivery_methods, task_id, priority
            ) VALUES (
                NEW.user_id,
                'Task Due Soon: ' || NEW.title,
                'Your task "' || NEW.title || '" is due on ' || NEW.due_date::text,
                'task_due',
                reminder_time,
                user_prefs.task_reminder_methods,
                NEW.id,
                CASE NEW.priority
                    WHEN 'urgent' THEN 'urgent'
                    WHEN 'high' THEN 'high'
                    ELSE 'medium'
                END
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically create task reminders
CREATE TRIGGER schedule_task_reminders_trigger
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION schedule_task_reminders();

-- Function to schedule time block reminders
CREATE OR REPLACE FUNCTION schedule_time_block_reminders()
RETURNS TRIGGER AS $$
DECLARE
    user_prefs RECORD;
    reminder_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user preferences
    SELECT * INTO user_prefs 
    FROM public.user_notification_preferences 
    WHERE user_id = NEW.user_id;
    
    -- Only create reminder if user has time block reminders enabled
    IF user_prefs.time_block_reminders_enabled THEN
        -- Calculate reminder time
        reminder_time := NEW.start_time - INTERVAL '1 minute' * COALESCE(user_prefs.time_block_reminder_advance_minutes, 15);
        
        -- Only create reminder if it's in the future
        IF reminder_time > NOW() THEN
            -- Delete existing reminders for this time block
            DELETE FROM public.reminders 
            WHERE time_block_id = NEW.id AND type = 'time_block_starting';
            
            -- Create new reminder
            INSERT INTO public.reminders (
                user_id, title, message, type, scheduled_for, 
                delivery_methods, time_block_id
            ) VALUES (
                NEW.user_id,
                'Time Block Starting Soon: ' || NEW.title,
                'Your time block "' || NEW.title || '" starts at ' || NEW.start_time::text,
                'time_block_starting',
                reminder_time,
                user_prefs.time_block_reminder_methods,
                NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically create time block reminders
CREATE TRIGGER schedule_time_block_reminders_trigger
    AFTER INSERT OR UPDATE ON public.time_blocks
    FOR EACH ROW EXECUTE FUNCTION schedule_time_block_reminders();
