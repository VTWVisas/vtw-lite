'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, Flag, Tag, Target } from 'lucide-react'
import { Database } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

type TaskColumn = Database['public']['Tables']['task_columns']['Row']
type Task = Database['public']['Tables']['tasks']['Row'] & {
  task_columns?: { name: string; color: string } | null
  goals?: { title: string } | null
}

interface TaskCreateModalProps {
  isOpen: boolean
  onClose: () => void
  columns: TaskColumn[]
  onTaskCreated: (task: Task) => void
  userId: string
}

export default function TaskCreateModal({
  isOpen,
  onClose,
  columns,
  onTaskCreated,
  userId
}: TaskCreateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [columnId, setColumnId] = useState(columns[0]?.id || '')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)

    try {
      // Get position for new task in column
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('column_id', columnId)

      const position = (count || 0) + 1

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          priority,
          column_id: columnId,
          position,
          tags,
          status: 'todo'
        })
        .select(`
          *,
          task_columns(name, color),
          goals(title)
        `)
        .single()

      if (error) throw error

      onTaskCreated(data)
      
      // Reset form
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
      setTags([])
      setTagInput('')
      
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Due Date and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Flag className="h-4 w-4" />
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Column */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Target className="h-4 w-4" />
                Column
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {title && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <Card className="border border-gray-200">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{title}</h4>
                      {description && (
                        <p className="text-xs text-gray-600">{description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                        {tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {dueDate && (
                        <p className="text-xs text-gray-500">
                          Due: {new Date(dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={!title.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Task'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
