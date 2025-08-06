import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoardView from '../components/BoardView'

export default async function TasksBoardPage() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
      </div>
      
      <BoardView
        columns={columns || []}
        tasks={tasks || []}
        setColumns={() => {}}
        setTasks={() => {}}
        userId={user.id}
      />
    </div>
  )
}
