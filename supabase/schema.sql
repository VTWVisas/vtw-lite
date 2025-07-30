-- Enable the pgcrypto extension to generate UUIDs
create extension if not exists "pgcrypto";

-- Enable Row Level Security
alter table if exists auth.users enable row level security;

-- Create tables for vtw-lite Life OS

-- Goals table
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  category text,
  target_date date,
  progress_percentage integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  status text default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  goal_id uuid references public.goals on delete cascade,
  title text not null,
  description text,
  due_date timestamp with time zone,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'todo' check (status in ('todo', 'in_progress', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habits table
create table public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  frequency text default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  target_count integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habit entries table (to track daily completions)
create table public.habit_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  habit_id uuid references public.habits on delete cascade not null,
  completed_at date not null,
  count integer default 1,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, completed_at)
);

-- Finance records table
create table public.finance_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('income', 'expense')),
  amount decimal(10,2) not null,
  category text not null,
  description text,
  tags text[],
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Journal entries table
create table public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  content text not null,
  mood_rating integer check (mood_rating >= 1 and mood_rating <= 5),
  tags text[],
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notes table (Personal Wiki)
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text not null,
  tags text[],
  linked_notes uuid[],
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index idx_goals_user_id on public.goals(user_id);
create index idx_goals_status on public.goals(status);
create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_goal_id on public.tasks(goal_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_habits_user_id on public.habits(user_id);
create index idx_habit_entries_user_id on public.habit_entries(user_id);
create index idx_habit_entries_habit_id on public.habit_entries(habit_id);
create index idx_habit_entries_date on public.habit_entries(completed_at);
create index idx_finance_records_user_id on public.finance_records(user_id);
create index idx_finance_records_date on public.finance_records(date);
create index idx_finance_records_type on public.finance_records(type);
create index idx_journal_entries_user_id on public.journal_entries(user_id);
create index idx_journal_entries_date on public.journal_entries(date);
create index idx_notes_user_id on public.notes(user_id);

-- Row Level Security (RLS) Policies

-- Goals policies
alter table public.goals enable row level security;
create policy "Users can view their own goals" on public.goals
  for select using (auth.uid() = user_id);
create policy "Users can insert their own goals" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own goals" on public.goals
  for update using (auth.uid() = user_id);
create policy "Users can delete their own goals" on public.goals
  for delete using (auth.uid() = user_id);

-- Tasks policies
alter table public.tasks enable row level security;
create policy "Users can view their own tasks" on public.tasks
  for select using (auth.uid() = user_id);
create policy "Users can insert their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Habits policies
alter table public.habits enable row level security;
create policy "Users can view their own habits" on public.habits
  for select using (auth.uid() = user_id);
create policy "Users can insert their own habits" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own habits" on public.habits
  for update using (auth.uid() = user_id);
create policy "Users can delete their own habits" on public.habits
  for delete using (auth.uid() = user_id);

-- Habit entries policies
alter table public.habit_entries enable row level security;
create policy "Users can view their own habit entries" on public.habit_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert their own habit entries" on public.habit_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own habit entries" on public.habit_entries
  for update using (auth.uid() = user_id);
create policy "Users can delete their own habit entries" on public.habit_entries
  for delete using (auth.uid() = user_id);

-- Finance records policies
alter table public.finance_records enable row level security;
create policy "Users can view their own finance records" on public.finance_records
  for select using (auth.uid() = user_id);
create policy "Users can insert their own finance records" on public.finance_records
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own finance records" on public.finance_records
  for update using (auth.uid() = user_id);
create policy "Users can delete their own finance records" on public.finance_records
  for delete using (auth.uid() = user_id);

-- Journal entries policies
alter table public.journal_entries enable row level security;
create policy "Users can view their own journal entries" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert their own journal entries" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own journal entries" on public.journal_entries
  for update using (auth.uid() = user_id);
create policy "Users can delete their own journal entries" on public.journal_entries
  for delete using (auth.uid() = user_id);

-- Notes policies
alter table public.notes enable row level security;
create policy "Users can view their own notes" on public.notes
  for select using (auth.uid() = user_id);
create policy "Users can insert their own notes" on public.notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on public.notes
  for update using (auth.uid() = user_id);
create policy "Users can delete their own notes" on public.notes
  for delete using (auth.uid() = user_id);

-- Functions to update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.goals
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.habits
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.finance_records
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.journal_entries
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.notes
  for each row execute procedure public.handle_updated_at();
