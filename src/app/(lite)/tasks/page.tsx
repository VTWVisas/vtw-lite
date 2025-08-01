import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Plus, Calendar, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch tasks from database
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      goals(title)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    const now = new Date()
    const isOverdue = date < now && date.toDateString() !== now.toDateString()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isOverdue) {
      return <span className="text-red-600 font-medium">Overdue - {date.toLocaleDateString()}</span>
    }
    if (isToday) {
      return <span className="text-orange-600 font-medium">Due Today</span>
    }
    return date.toLocaleDateString()
  }

  const todayTasks = tasks?.filter(task => {
    if (!task.due_date) return false
    const today = new Date().toDateString()
    return new Date(task.due_date).toDateString() === today
  }) || []

  const overdueTasks = tasks?.filter(task => {
    if (!task.due_date) return false
    const today = new Date()
    const dueDate = new Date(task.due_date)
    return dueDate < today && dueDate.toDateString() !== today.toDateString()
  }) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CheckSquare className="h-8 w-8 text-green-600 mr-3" />
            Tasks
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Organize and track your daily tasks
          </p>
        </div>
        <Button asChild className="gradient-primary">
          <Link href="/tasks/new">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {tasks && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Today</p>
                  <p className="text-2xl font-bold text-orange-600">{todayTasks.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tasks.filter(task => task.status === 'completed').length}
                  </p>
                </div>
                <CheckSquare className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">All Tasks</Button>
        <Button variant="outline" size="sm">Due Today</Button>
        <Button variant="outline" size="sm">Overdue</Button>
        <Button variant="outline" size="sm">In Progress</Button>
        <Button variant="outline" size="sm">Completed</Button>
      </div>

      {/* Tasks List */}
      {error ? (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading tasks: {error.message}</p>
          </CardContent>
        </Card>
      ) : tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="border-0 atlassian-shadow card-hover">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-gray-600 mb-3">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(task.due_date)}
                      </div>
                      {task.goals && (
                        <div className="flex items-center">
                          <CheckSquare className="h-4 w-4 mr-1" />
                          Goal: {task.goals.title}
                        </div>
                      )}
                      <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tasks/${task.id}`}>Edit</Link>
                    </Button>
                    {task.status !== 'completed' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first task to start organizing your day.
            </p>
            <Button asChild className="gradient-primary">
              <Link href="/tasks/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
