-- Tasks Kanban Upgrade Migration
-- Adds support for kanban columns and task positioning

-- Create task_columns table for kanban board columns
create table public.task_columns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  position integer not null,
  color text default '#6b7280', -- Default gray color
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, position)
);

-- Add new columns to existing tasks table
alter table public.tasks add column if not exists column_id uuid references public.task_columns on delete set null;
alter table public.tasks add column if not exists position integer default 0;
alter table public.tasks add column if not exists tags text[] default '{}';

-- Create indexes for better performance
create index idx_task_columns_user_id on public.task_columns(user_id);
create index idx_task_columns_position on public.task_columns(user_id, position);
create index idx_tasks_column_id on public.tasks(column_id);
create index idx_tasks_position on public.tasks(column_id, position);
create index idx_tasks_tags on public.tasks using gin(tags);

-- Enable RLS for task_columns
alter table public.task_columns enable row level security;

-- Task columns policies
create policy "Users can view their own task columns" on public.task_columns
  for select using (auth.uid() = user_id);
create policy "Users can insert their own task columns" on public.task_columns
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own task columns" on public.task_columns
  for update using (auth.uid() = user_id);
create policy "Users can delete their own task columns" on public.task_columns
  for delete using (auth.uid() = user_id);

-- Add updated_at trigger for task_columns
create trigger handle_updated_at_task_columns before update on public.task_columns
  for each row execute procedure handle_updated_at();

-- Insert default columns for existing users
insert into public.task_columns (user_id, name, position, color)
select 
  distinct user_id,
  'To Do',
  1,
  '#6b7280'
from public.tasks
where user_id not in (select user_id from public.task_columns)
on conflict do nothing;

insert into public.task_columns (user_id, name, position, color)
select 
  distinct user_id,
  'In Progress',
  2,
  '#3b82f6'
from public.tasks
where user_id not in (select user_id from public.task_columns where name = 'In Progress')
on conflict do nothing;

insert into public.task_columns (user_id, name, position, color)
select 
  distinct user_id,
  'Done',
  3,
  '#10b981'
from public.tasks
where user_id not in (select user_id from public.task_columns where name = 'Done')
on conflict do nothing;

-- Update existing tasks to map to default columns based on status
update public.tasks 
set column_id = (
  select id from public.task_columns 
  where task_columns.user_id = tasks.user_id 
  and task_columns.name = case 
    when tasks.status = 'todo' then 'To Do'
    when tasks.status = 'in_progress' then 'In Progress'
    when tasks.status = 'completed' then 'Done'
    else 'To Do'
  end
  limit 1
)
where column_id is null;

-- Set positions for existing tasks within their columns
with task_positions as (
  select 
    id,
    row_number() over (partition by column_id order by created_at) as new_position
  from public.tasks
  where position = 0
)
update public.tasks 
set position = task_positions.new_position
from task_positions
where tasks.id = task_positions.id;
