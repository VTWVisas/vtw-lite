import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedView from '../components/FeedView'

export default async function TasksFeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Task Feed</h1>
      </div>
      
      <FeedView
        tasks={tasks || []}
        setTasks={() => {}}
        userId={user.id}
      />
    </div>
  )
}
