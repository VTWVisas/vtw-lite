-- Time Management Module Schema
-- Created: 2025-08-04

-- Enable RLS on auth.users if not already enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Tags table for categorizing time blocks and activities
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_tag_name_per_user UNIQUE(user_id, name),
    CONSTRAINT valid_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Time blocks table for scheduling
CREATE TABLE IF NOT EXISTS public.time_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    task_id UUID, -- Optional reference to tasks table (for future integration)
    color VARCHAR(7) DEFAULT '#3B82F6', -- fallback color if no tags
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_block_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Junction table for many-to-many relationship between time_blocks and tags
CREATE TABLE IF NOT EXISTS public.time_block_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    time_block_id UUID REFERENCES public.time_blocks(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_time_block_tag UNIQUE(time_block_id, tag_id)
);

-- Pomodoro sessions table for tracking focus sessions
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255),
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    break_duration_minutes INTEGER DEFAULT 5,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    time_block_id UUID REFERENCES public.time_blocks(id) ON DELETE SET NULL,
    task_id UUID, -- Optional reference to tasks table
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 120),
    CONSTRAINT valid_break_duration CHECK (break_duration_minutes >= 0 AND break_duration_minutes <= 60),
    CONSTRAINT valid_completion CHECK (
        (is_completed = TRUE AND completed_at IS NOT NULL) OR 
        (is_completed = FALSE)
    )
);

-- Junction table for pomodoro sessions and tags
CREATE TABLE IF NOT EXISTS public.pomodoro_session_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pomodoro_session_id UUID REFERENCES public.pomodoro_sessions(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_pomodoro_session_tag UNIQUE(pomodoro_session_id, tag_id)
);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_block_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_session_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Users can view their own tags" ON public.tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.tags
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for time_blocks
CREATE POLICY "Users can view their own time blocks" ON public.time_blocks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time blocks" ON public.time_blocks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks" ON public.time_blocks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks" ON public.time_blocks
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for time_block_tags
CREATE POLICY "Users can view their own time block tags" ON public.time_block_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.time_blocks tb 
            WHERE tb.id = time_block_id AND tb.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own time block tags" ON public.time_block_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.time_blocks tb 
            WHERE tb.id = time_block_id AND tb.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own time block tags" ON public.time_block_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.time_blocks tb 
            WHERE tb.id = time_block_id AND tb.user_id = auth.uid()
        )
    );

-- RLS Policies for pomodoro_sessions
CREATE POLICY "Users can view their own pomodoro sessions" ON public.pomodoro_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pomodoro sessions" ON public.pomodoro_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro sessions" ON public.pomodoro_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pomodoro sessions" ON public.pomodoro_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pomodoro_session_tags
CREATE POLICY "Users can view their own pomodoro session tags" ON public.pomodoro_session_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pomodoro_sessions ps 
            WHERE ps.id = pomodoro_session_id AND ps.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own pomodoro session tags" ON public.pomodoro_session_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pomodoro_sessions ps 
            WHERE ps.id = pomodoro_session_id AND ps.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own pomodoro session tags" ON public.pomodoro_session_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.pomodoro_sessions ps 
            WHERE ps.id = pomodoro_session_id AND ps.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_time_blocks_user_id ON public.time_blocks(user_id);
CREATE INDEX idx_time_blocks_start_time ON public.time_blocks(start_time);
CREATE INDEX idx_time_blocks_user_date ON public.time_blocks(user_id, date(start_time));
CREATE INDEX idx_time_block_tags_time_block_id ON public.time_block_tags(time_block_id);
CREATE INDEX idx_time_block_tags_tag_id ON public.time_block_tags(tag_id);
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_started_at ON public.pomodoro_sessions(started_at);
CREATE INDEX idx_pomodoro_sessions_user_date ON public.pomodoro_sessions(user_id, date(started_at));
CREATE INDEX idx_pomodoro_session_tags_session_id ON public.pomodoro_session_tags(pomodoro_session_id);
CREATE INDEX idx_pomodoro_session_tags_tag_id ON public.pomodoro_session_tags(tag_id);

-- Insert some default tags for new users (optional)
-- These will be created via the application when a user first accesses the time management module

-- Functions for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_blocks_updated_at BEFORE UPDATE ON public.time_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
