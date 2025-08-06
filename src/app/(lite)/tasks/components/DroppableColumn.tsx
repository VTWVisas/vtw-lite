'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MoreHorizontal } from 'lucide-react'
import { Database } from '@/lib/types/database.types'
import DraggableTaskCard from './DraggableTaskCard'

type TaskColumn = Database['public']['Tables']['task_columns']['Row']
type Task = Database['public']['Tables']['tasks']['Row'] & {
  task_columns?: { name: string; color: string } | null
  goals?: { title: string } | null
}

interface DroppableColumnProps {
  column: TaskColumn
  tasks: Task[]
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onAddTask?: (columnId: string) => void
  isOver?: boolean
}

export default function DroppableColumn({ 
  column, 
  tasks, 
  onTaskUpdate, 
  onTaskDelete, 
  onAddTask,
  isOver = false
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    }
  })

  return (
    <motion.div 
      className="min-w-80 flex-shrink-0"
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <Card className={`
        h-full border-0 atlassian-shadow transition-all duration-200
        ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}
      `}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <h3 className="font-semibold text-gray-900">{column.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <SortableContext 
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <motion.div 
              ref={setNodeRef}
              className={`
                min-h-32 space-y-3 transition-all duration-200 rounded-lg p-2
                ${isOver ? 'bg-blue-50/30 border-2 border-dashed border-blue-300' : 'border-2 border-transparent'}
              `}
              layout
              data-column-id={column.id}
            >
              {tasks.length === 0 ? (
                <motion.div
                  className="h-24 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {isOver ? 'Drop task here' : 'No tasks yet'}
                </motion.div>
              ) : (
                <motion.div layout className="space-y-3">
                  {tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        delay: index * 0.05
                      }}
                    >
                      <DraggableTaskCard
                        task={task}
                        onUpdate={onTaskUpdate}
                        onDelete={onTaskDelete}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* Drop zone indicator when dragging over */}
              {isOver && tasks.length > 0 && (
                <motion.div
                  className="h-8 bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                >
                  <span className="text-blue-600 text-xs font-medium">Drop here</span>
                </motion.div>
              )}
            </motion.div>
          </SortableContext>
          
          {/* Add Task Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-500 hover:text-gray-700 mt-3 group"
              onClick={() => onAddTask?.(column.id)}
            >
              <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Add a task
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
