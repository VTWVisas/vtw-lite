'use client'

import React, { useState, useEffect } from 'react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  closestCorners,
  DragOverEvent
} from '@dnd-kit/core'
import { 
  arrayMove 
} from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { Database } from '@/lib/types/database.types'
import DraggableTaskCard from './DraggableTaskCard'
import DroppableColumn from './DroppableColumn'
import { createClient } from '@/lib/supabase/client'

type TaskColumn = Database['public']['Tables']['task_columns']['Row']
type Task = Database['public']['Tables']['tasks']['Row'] & {
  task_columns?: { name: string; color: string } | null
  goals?: { title: string } | null
}

interface BoardViewProps {
  columns: TaskColumn[]
  tasks: Task[]
  setColumns: (columns: TaskColumn[]) => void
  setTasks: (tasks: Task[]) => void
  userId: string
}

export default function BoardView({ 
  columns, 
  tasks, 
  setTasks 
}: BoardViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState(tasks)
  const supabase = createClient()

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = localTasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveColumn(null)
      return
    }

    const overId = over.id as string

    // Check if we're over a column
    const overColumn = columns.find(col => col.id === overId)
    if (overColumn) {
      setActiveColumn(overColumn.id)
    }

    // Handle moving between columns
    const activeTask = localTasks.find(t => t.id === active.id)
    const overTask = localTasks.find(t => t.id === overId)
    
    if (!activeTask) return

    const activeColumnId = activeTask.column_id
    const overColumnId = overTask?.column_id || overId

    if (activeColumnId !== overColumnId) {
      // Move task to different column
      setLocalTasks((prev) => {
        const activeIndex = prev.findIndex(t => t.id === active.id)
        
        const newTasks = [...prev]
        newTasks[activeIndex] = { ...newTasks[activeIndex], column_id: overColumnId as string }

        // Reorder within the new column
        const tasksInNewColumn = newTasks.filter(t => t.column_id === overColumnId)
        const otherTasks = newTasks.filter(t => t.column_id !== overColumnId)
        
        tasksInNewColumn.forEach((task, index) => {
          task.position = index + 1
        })

        return [...otherTasks, ...tasksInNewColumn]
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveTask(null)
    setActiveColumn(null)
    
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeTask = localTasks.find(t => t.id === activeId)
    if (!activeTask) return

    const overTask = localTasks.find(t => t.id === overId)
    const targetColumnId = overTask?.column_id || overId

    // Get tasks in target column and their new positions
    const tasksInTargetColumn = localTasks
      .filter(t => t.column_id === targetColumnId)
      .sort((a, b) => a.position - b.position)

    const activeIndex = tasksInTargetColumn.findIndex(t => t.id === activeId)
    const overIndex = overTask 
      ? tasksInTargetColumn.findIndex(t => t.id === overId)
      : tasksInTargetColumn.length

    if (activeIndex !== overIndex) {
      const reorderedTasks = arrayMove(tasksInTargetColumn, activeIndex, overIndex)
      
      // Update positions
      const updatedTasks = reorderedTasks.map((task, index) => ({
        ...task,
        position: index + 1
      }))

      // Update database
      try {
        for (const task of updatedTasks) {
          await supabase
            .from('tasks')
            .update({ 
              column_id: targetColumnId, 
              position: task.position 
            })
            .eq('id', task.id)
        }

        // Update parent state
        setTasks(localTasks.map(task => {
          const updatedTask = updatedTasks.find(ut => ut.id === task.id)
          return updatedTask || task
        }))
      } catch (error) {
        console.error('Error updating task positions:', error)
        // Revert local state on error
        setLocalTasks(tasks)
      }
    }
  }

  const getTasksForColumn = (columnId: string) => {
    return tasks
      .filter(task => task.column_id === columnId)
      .sort((a, b) => a.position - b.position)
  }

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

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <motion.div 
        className="flex gap-6 overflow-x-auto pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {columns.map((column) => {
            const columnTasks = getTasksForColumn(column.id)
            
            return (
              <DroppableColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                onTaskUpdate={(updatedTask: Task) => {
                  setTasks(localTasks.map(t => 
                    t.id === updatedTask.id ? updatedTask : t
                  ))
                }}
                onTaskDelete={(taskId: string) => {
                  setTasks(localTasks.filter(t => t.id !== taskId))
                }}
                onAddTask={(columnId: string) => {
                  // TODO: Open inline task creation
                  console.log('Add task to column:', columnId)
                }}
                isOver={activeColumn === column.id}
              />
            )
          })}
        </AnimatePresence>
        
        {/* Add Column Button */}
        <motion.div 
          className="min-w-80 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-fit border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
            <CardContent className="p-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    // TODO: Add new column functionality
                    console.log('Add new column')
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add another list
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Enhanced Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.05, rotate: 3 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <Card className="w-80 shadow-2xl opacity-90 border-blue-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">{activeTask.title}</h4>
                  {activeTask.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {activeTask.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(activeTask.priority)}>
                      {activeTask.priority}
                    </Badge>
                    {activeTask.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {activeTask.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{activeTask.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
