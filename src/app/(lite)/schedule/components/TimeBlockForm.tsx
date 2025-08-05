'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, addHours, startOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Save, Loader2 } from 'lucide-react'

type TimeBlock = Database['public']['Tables']['time_blocks']['Row'] & {
  tags?: Database['public']['Tables']['tags']['Row'][]
}

type Tag = Database['public']['Tables']['tags']['Row']

interface TimeBlockFormProps {
  block?: TimeBlock | null
  selectedDate: Date
  tags: Tag[]
  onSave: () => void
  onCancel: () => void
}

export default function TimeBlockForm({
  block,
  selectedDate,
  tags,
  onSave,
  onCancel
}: TimeBlockFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [color, setColor] = useState('#3B82F6')
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (block) {
      setTitle(block.title)
      setDescription(block.description || '')
      setStartTime(format(new Date(block.start_time), 'HH:mm'))
      setEndTime(format(new Date(block.end_time), 'HH:mm'))
      setColor(block.color)
      setIsCompleted(block.is_completed)
      setSelectedTags(block.tags?.map(tag => tag.id) || [])
    } else {
      // Set default values for new block
      const now = new Date()
      const defaultStart = new Date(selectedDate)
      defaultStart.setHours(now.getHours(), 0, 0, 0)
      const defaultEnd = addHours(defaultStart, 1)
      
      setStartTime(format(defaultStart, 'HH:mm'))
      setEndTime(format(defaultEnd, 'HH:mm'))
    }
  }, [block, selectedDate])

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create datetime objects
      const startDateTime = new Date(selectedDate)
      const [startHour, startMinute] = startTime.split(':').map(Number)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(selectedDate)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      // Validate times
      if (endDateTime <= startDateTime) {
        alert('End time must be after start time')
        return
      }

      const blockData = {
        title,
        description: description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        color,
        is_completed: isCompleted,
      }

      let blockId: string

      if (block) {
        // Update existing block
        const { error } = await supabase
          .from('time_blocks')
          .update(blockData)
          .eq('id', block.id)

        if (error) throw error
        blockId = block.id

        // Delete existing tag associations
        await supabase
          .from('time_block_tags')
          .delete()
          .eq('time_block_id', blockId)
      } else {
        // Create new block
        const { data, error } = await supabase
          .from('time_blocks')
          .insert([blockData])
          .select()
          .single()

        if (error) throw error
        blockId = data.id
      }

      // Create tag associations
      if (selectedTags.length > 0) {
        const tagAssociations = selectedTags.map(tagId => ({
          time_block_id: blockId,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('time_block_tags')
          .insert(tagAssociations)

        if (tagError) throw tagError
      }

      onSave()
    } catch (error) {
      console.error('Error saving time block:', error)
      alert('Error saving time block')
    } finally {
      setLoading(false)
    }
  }

  const PRESET_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
  ]

  return (
    <Card className="p-0 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {block ? 'Edit Time Block' : 'Create Time Block'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-blue-100 mt-1">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you working on?"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details (optional)"
            rows={3}
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <motion.button
                key={presetColor}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === presetColor 
                    ? 'border-slate-900 ring-2 ring-slate-300' 
                    : 'border-slate-200 hover:border-slate-400'
                }`}
                style={{ backgroundColor: presetColor }}
                onClick={() => setColor(presetColor)}
              />
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id)
              return (
                <motion.button
                  key={tag.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-1'
                      : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: isSelected ? tag.color : tag.color + '20',
                    color: isSelected ? 'white' : tag.color,
                  }}
                >
                  {isSelected && <Plus className="w-3 h-3 rotate-45" />}
                  {tag.name}
                </motion.button>
              )
            })}
          </div>
          {tags.length === 0 && (
            <p className="text-sm text-slate-500">
              No tags available. Create tags in the sidebar to organize your time blocks.
            </p>
          )}
        </div>

        {/* Completion Status */}
        {block && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completed"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="rounded border-slate-300"
            />
            <Label htmlFor="completed">Mark as completed</Label>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !title.trim()}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {block ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
