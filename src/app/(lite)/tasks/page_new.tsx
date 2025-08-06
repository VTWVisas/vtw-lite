import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksLayout from './components/TasksLayout'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch task columns
  const { data: columns } = await supabase
    .from('task_columns')
    .select('*')
    .eq('user_id', user.id)
    .order('position')

  // Fetch tasks with their columns and goals
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      task_columns(name, color),
      goals(title)
    `)
    .eq('user_id', user.id)
    .order('position')

  return (
    <TasksLayout 
      initialColumns={columns || []} 
      initialTasks={tasks || []} 
      userId={user.id}
    />
  )
}
