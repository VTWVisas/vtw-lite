'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, Check, X, Tag } from 'lucide-react'

type TagType = Database['public']['Tables']['tags']['Row']

interface TagManagerProps {
  tags: TagType[]
  onTagsUpdated: () => void
}

export default function TagManager({ tags, onTagsUpdated }: TagManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const PRESET_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280', // Gray
  ]

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('tags')
        .insert([{
          name: newTagName.trim(),
          color: newTagColor
        }])

      if (error) throw error

      setNewTagName('')
      setNewTagColor('#3B82F6')
      setIsCreating(false)
      onTagsUpdated()
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Error creating tag')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTag = async (tag: TagType) => {
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          name: newTagName.trim(),
          color: newTagColor
        })
        .eq('id', tag.id)

      if (error) throw error

      setNewTagName('')
      setNewTagColor('#3B82F6')
      setEditingTag(null)
      onTagsUpdated()
    } catch (error) {
      console.error('Error updating tag:', error)
      alert('Error updating tag')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all time blocks.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error
      onTagsUpdated()
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Error deleting tag')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (tag: TagType) => {
    setEditingTag(tag)
    setNewTagName(tag.name)
    setNewTagColor(tag.color)
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingTag(null)
    setIsCreating(false)
    setNewTagName('')
    setNewTagColor('#3B82F6')
  }

  const startCreate = () => {
    setIsCreating(true)
    setEditingTag(null)
    setNewTagName('')
    setNewTagColor('#3B82F6')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={startCreate}
          disabled={isCreating || editingTag !== null}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {/* Tag List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                editingTag?.id === tag.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
              }`}
            >
              {editingTag?.id === tag.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name"
                    className="h-8"
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 ${
                          newTagColor === color ? 'border-slate-900' : 'border-slate-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateTag(tag)}
                      disabled={loading || !newTagName.trim()}
                      className="h-7 px-2"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      className="h-7 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm font-medium text-slate-700">{tag.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(tag)}
                      disabled={isCreating || editingTag !== null}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTag(tag.id)}
                      disabled={loading}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Create New Tag Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-2 rounded-lg border border-blue-200 bg-blue-50 space-y-2"
            >
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                className="h-8"
                autoFocus
              />
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      newTagColor === color ? 'border-slate-900' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={loading || !newTagName.trim()}
                  className="h-7 px-2"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {tags.length === 0 && !isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-slate-500"
        >
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tags yet</p>
          <p className="text-xs">Create tags to organize your time blocks</p>
        </motion.div>
      )}
    </div>
  )
}
