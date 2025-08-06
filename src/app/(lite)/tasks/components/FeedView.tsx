'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle,
  Flag,
  User,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react'
import { Database } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  task_columns?: { name: string; color: string } | null
  goals?: { title: string } | null
}

interface FeedViewProps {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  userId: string
}

export default function FeedView({ tasks, setTasks }: FeedViewProps) {
  const supabase = createClient()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    const baseClasses = "h-4 w-4"
    switch (priority) {
      case 'urgent':
        return <Flag className={`${baseClasses} text-red-600`} />
      case 'high':
        return <Flag className={`${baseClasses} text-orange-600`} />
      case 'medium':
        return <Flag className={`${baseClasses} text-yellow-600`} />
      case 'low':
        return <Flag className={`${baseClasses} text-green-600`} />
      default:
        return <Flag className={`${baseClasses} text-gray-600`} />
    }
  }

  const getTasksByCategory = () => {
    const now = new Date()
    const today = now.toDateString()
    
    const todayTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false
      return new Date(task.due_date).toDateString() === today
    })

    const overdueTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false
      const dueDate = new Date(task.due_date)
      return dueDate < now && dueDate.toDateString() !== today
    })

    const upcomingTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false
      const dueDate = new Date(task.due_date)
      return dueDate > now
    })

    const completedTasks = tasks.filter(task => task.status === 'completed')

    const noDueDateTasks = tasks.filter(task => 
      !task.due_date && task.status !== 'completed'
    )

    return {
      overdue: overdueTasks,
      today: todayTasks,
      upcoming: upcomingTasks,
      noDueDate: noDueDateTasks,
      completed: completedTasks
    }
  }

  const handleStatusToggle = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (!error) {
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, status: newStatus } : t
      ))
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const TaskRow = ({ task }: { task: Task }) => (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors group">
      {/* Completion Toggle */}
      <button
        onClick={() => handleStatusToggle(task)}
        className="flex-shrink-0"
      >
        {task.status === 'completed' ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${
              task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {task.description}
              </p>
            )}
            
            {/* Meta info */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.due_date)}
                </span>
              )}
              {task.goals && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.goals.title}
                </span>
              )}
              {task.task_columns && (
                <span className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: task.task_columns.color }}
                  />
                  {task.task_columns.name}
                </span>
              )}
            </div>
          </div>
          
          {/* Right side info */}
          <div className="flex items-center gap-2 ml-4">
            {/* Priority */}
            <div className="flex items-center gap-1">
              {getPriorityIcon(task.priority)}
              <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                {task.priority}
              </Badge>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{task.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const categories = getTasksByCategory()

  return (
    <div className="space-y-6">
      {/* Overdue Tasks */}
      {categories.overdue.length > 0 && (
        <Card className="border-0 atlassian-shadow border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-900">
                Overdue ({categories.overdue.length})
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {categories.overdue.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      {categories.today.length > 0 && (
        <Card className="border-0 atlassian-shadow border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">
                Due Today ({categories.today.length})
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {categories.today.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Tasks */}
      {categories.upcoming.length > 0 && (
        <Card className="border-0 atlassian-shadow border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Upcoming ({categories.upcoming.length})
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {categories.upcoming
                .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                .map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Due Date Tasks */}
      {categories.noDueDate.length > 0 && (
        <Card className="border-0 atlassian-shadow border-l-4 border-l-gray-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">
                No Due Date ({categories.noDueDate.length})
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {categories.noDueDate.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks */}
      {categories.completed.length > 0 && (
        <Card className="border-0 atlassian-shadow border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">
                Completed ({categories.completed.length})
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {categories.completed
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .slice(0, 10) // Show only last 10 completed tasks
                .map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first task to start organizing your day.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
