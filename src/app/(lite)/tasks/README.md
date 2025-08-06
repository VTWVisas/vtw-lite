# Tasks Module - Kanban Board & Feed Views

## ✅ Overview

The Tasks module has been upgraded to support both **Board View** (Kanban-style) and **Feed View** (grouped list-style) for better task organization and management.

## 🧩 Features

### Board View (Kanban-style)
- **Multiple Columns**: Users can organize tasks in customizable columns (e.g., To Do, Doing, Done)
- **Drag & Drop**: Tasks can be dragged between columns and reordered within columns
- **Task Cards**: Rich task cards showing title, description, tags, due date, priority, and quick actions
- **Inline Task Creation**: Create new tasks directly within each column
- **Column Management**: Add, edit, and customize columns with colors

### Feed View (List-style)
- **Smart Grouping**: Tasks grouped by:
  - **Overdue** (red border) - Past due date
  - **Due Today** (orange border) - Due today
  - **Upcoming** (blue border) - Future due dates
  - **No Due Date** (gray border) - Tasks without due dates
  - **Completed** (green border) - Recently completed tasks
- **Quick Actions**: Complete, edit, delete tasks inline
- **Compact View**: Shows essential information in a scannable list format

### Universal Features
- **Search & Filter**: Real-time task search across titles, descriptions, and tags
- **Priority System**: Low, Medium, High, Urgent priorities with color coding
- **Tags System**: Add multiple tags to categorize tasks
- **Stats Dashboard**: Overview cards showing total tasks, due today, overdue, and completed
- **Goal Integration**: Link tasks to existing goals
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Drag & Drop**: @dnd-kit (already installed)
- **Animations**: framer-motion (already installed)
- **Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- **Real-time**: Supabase real-time subscriptions (future enhancement)

## 🗄️ Database Schema

### New Table: `task_columns`
```sql
create table public.task_columns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  position integer not null,
  color text default '#6b7280',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Updated `tasks` Table
New columns added:
- `column_id` (uuid) - References task_columns.id
- `position` (integer) - Position within column
- `tags` (text[]) - Array of tag strings

## 📁 File Structure

```
src/app/(lite)/tasks/
├── page.tsx                    # Main tasks page with view toggle
├── board/
│   └── page.tsx               # Direct board view route
├── feed/
│   └── page.tsx               # Direct feed view route
└── components/
    ├── TasksLayout.tsx        # Main layout with view switching
    ├── BoardView.tsx          # Kanban board implementation
    ├── FeedView.tsx           # Grouped list implementation
    ├── TaskCard.tsx           # Individual task card component
    └── TaskCreateModal.tsx    # Task creation modal
```

## 🎨 Design System

Following **Atlassian-style** design patterns:

- **Rounded Corners**: Consistent border radius for cards and buttons
- **Shadows**: Subtle shadows with `atlassian-shadow` class
- **Color System**: 
  - Priority indicators (red, orange, yellow, green)
  - Column colors (customizable hex values)
  - Status-based border colors for feed groupings
- **Hover Effects**: Smooth transitions and hover states
- **Typography**: Clear hierarchy with proper contrast

## 🚀 Getting Started

### 1. Run Database Migration
```bash
# Apply the new schema
supabase db push
```

### 2. Default Columns Setup
The migration automatically creates default columns for existing users:
- **To Do** (Gray, position 1)
- **In Progress** (Blue, position 2) 
- **Done** (Green, position 3)

### 3. Access the Module
- Main tasks page: `/tasks` (defaults to board view)
- Direct board access: `/tasks/board`
- Direct feed access: `/tasks/feed`

## 🔐 Security

- **Row Level Security (RLS)**: All tables have RLS enabled
- **User Isolation**: Users can only access their own tasks and columns
- **Secure Operations**: All database operations use authenticated user context

## 📱 Responsive Design

- **Desktop**: Full board view with horizontal scrolling
- **Tablet**: Optimized column widths and touch interactions
- **Mobile**: Stacked layout with smooth scrolling

## 🎯 Future Enhancements

1. **Real-time Collaboration**: Supabase real-time for live updates
2. **Advanced Filtering**: Filter by priority, tags, due dates, goals
3. **Bulk Operations**: Select multiple tasks for batch actions
4. **Custom Views**: Save custom filter combinations
5. **Time Tracking**: Add time logging to tasks
6. **Templates**: Task and column templates
7. **Automation**: Auto-move tasks based on rules
8. **Notifications**: Due date reminders and push notifications

## 🧪 Testing

Test scenarios to verify:
- [ ] Create new tasks via modal
- [ ] Drag tasks between columns
- [ ] Toggle task completion status
- [ ] Search functionality works
- [ ] View switching (board ↔ feed)
- [ ] Responsive layout on mobile
- [ ] Tag management
- [ ] Priority color coding
- [ ] Due date highlighting

## 🐛 Known Issues

- None currently identified

## 📊 Performance

- Optimized queries with proper indexing
- Lazy loading for large task lists (future)
- Efficient drag & drop with @dnd-kit
- Minimal re-renders with React optimization

The Tasks module now provides a comprehensive task management experience with both visual board organization and efficient list-based workflows!
