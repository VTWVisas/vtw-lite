'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  LayoutGrid, 
  List, 
  Plus, 
  Filter, 
  Search,
  CheckSquare,
  Calendar,
  AlertCircle 
} from 'lucide-react'
import { Database } from '@/lib/types/database.types'
import BoardView from './BoardView'
import FeedView from './FeedView'
import TaskCreateModal from './TaskCreateModal'

type TaskColumn = Database['public']['Tables']['task_columns']['Row']
type Task = Database['public']['Tables']['tasks']['Row'] & {
  task_columns?: { name: string; color: string } | null
  goals?: { title: string } | null
}

interface TasksLayoutProps {
  initialColumns: TaskColumn[]
  initialTasks: Task[]
  userId: string
}

export default function TasksLayout({ 
  initialColumns, 
  initialTasks, 
  userId 
}: TasksLayoutProps) {
  const [view, setView] = useState<'board' | 'feed'>('board')
  const [columns, setColumns] = useState(initialColumns)
  const [tasks, setTasks] = useState(initialTasks)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Stats calculations
  const todayTasks = tasks.filter(task => {
    if (!task.due_date) return false
    const today = new Date().toDateString()
    return new Date(task.due_date).toDateString() === today
  })

  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false
    const today = new Date()
    const dueDate = new Date(task.due_date)
    return dueDate < today && dueDate.toDateString() !== today.toDateString()
  })

  const completedTasks = tasks.filter(task => task.status === 'completed')

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
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
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="gradient-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
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
                <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 p-1">
            <Button
              variant={view === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('board')}
              className="h-8"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </Button>
            <Button
              variant={view === 'feed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('feed')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-2" />
              Feed
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Views */}
      {view === 'board' ? (
        <BoardView
          columns={columns}
          tasks={filteredTasks}
          setColumns={setColumns}
          setTasks={setTasks}
          userId={userId}
        />
      ) : (
        <FeedView
          tasks={filteredTasks}
          setTasks={setTasks}
          userId={userId}
        />
      )}

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columns={columns}
        onTaskCreated={(newTask: Task) => {
          setTasks(prev => [...prev, newTask])
          setIsCreateModalOpen(false)
        }}
        userId={userId}
      />
    </div>
  )
}
