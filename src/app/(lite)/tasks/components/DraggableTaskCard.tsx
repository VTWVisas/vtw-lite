'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  GripVertical, 
  MoreHorizontal,
  User,
  Flag 
} from 'lucide-react'
import { Database } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  task_columns?: { name: string; color: string } | null
  goals?: { title: string } | null
}

interface DraggableTaskCardProps {
  task: Task
  onUpdate: (task: Task) => void
  onDelete: (taskId: string) => void
  isDragging?: boolean
}

export default function DraggableTaskCard({ task, onUpdate, onDelete }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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
    const baseClasses = "h-3 w-3"
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const isOverdue = date < now && date.toDateString() !== now.toDateString()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isOverdue) {
      return (
        <span className="text-red-600 text-xs flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Overdue
        </span>
      )
    }
    if (isToday) {
      return (
        <span className="text-orange-600 text-xs flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Due Today
        </span>
      )
    }
    return (
      <span className="text-gray-500 text-xs flex items-center">
        <Calendar className="h-3 w-3 mr-1" />
        {date.toLocaleDateString()}
      </span>
    )
  }

  const handleStatusToggle = async () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (!error) {
      onUpdate({ ...task, status: newStatus })
    }
  }

  const handleDelete = async () => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)

    if (!error) {
      onDelete(task.id)
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 1.02 : 1,
        y: 0
      }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={`
        cursor-pointer group
        ${isDragging ? 'z-50' : 'z-0'}
      `}
    >
      <Card className={`
        transition-all duration-200 hover:shadow-md border-0 atlassian-shadow
        ${isDragging ? 'shadow-xl rotate-3' : ''}
        ${task.status === 'completed' ? 'opacity-75' : ''}
      `}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with drag handle and menu */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <motion.button
                  {...attributes}
                  {...listeners}
                  className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GripVertical className="h-4 w-4" />
                </motion.button>
                <div className="flex-1">
                  <h4 className={`font-medium text-sm ${
                    task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </h4>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>

            {/* Description */}
            {task.description && (
              <motion.p 
                className="text-xs text-gray-600 line-clamp-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {task.description}
              </motion.p>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <motion.div 
                className="flex flex-wrap gap-1"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {task.tags.map((tag, index) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      {tag}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Priority */}
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  {getPriorityIcon(task.priority)}
                  <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-0`}>
                    {task.priority}
                  </Badge>
                </motion.div>
                
                {/* Goal */}
                {task.goals && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate max-w-20">
                      {task.goals.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Due date */}
              {task.due_date && formatDate(task.due_date)}
            </div>

            {/* Actions */}
            <motion.div 
              className="flex gap-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ opacity: 0, y: 5 }}
              whileHover={{ opacity: 1, y: 0 }}
            >
              <Button
                size="sm"
                variant={task.status === 'completed' ? 'outline' : 'default'}
                className="h-7 text-xs flex-1"
                onClick={handleStatusToggle}
              >
                {task.status === 'completed' ? 'Reopen' : 'Complete'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
