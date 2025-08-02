'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { 
  Save, 
  ArrowLeft, 
  Calendar, 
  Hash, 
  Star, 
  StarOff,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TextareaAutosize from 'react-textarea-autosize'

interface Note {
  id: string
  title: string
  content: string
  tags: string[] | null
  created_at: string
  updated_at: string
  is_pinned?: boolean
}

interface NoteEditorProps {
  note?: Note
  isNew?: boolean
}

export default function NoteEditor({ note, isNew = false }: NoteEditorProps) {
  const router = useRouter()
  const { user } = useUser()
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [tags, setTags] = useState<string[]>(note?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(note ? new Date(note.updated_at) : null)
  
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Auto-save functionality
  const saveNote = useCallback(async () => {
    if (!user || (!title.trim() && !content.trim())) return

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const supabase = createClient()
      const noteData = {
        title: title.trim() || 'Untitled',
        content: content.trim(),
        tags: tags.length > 0 ? tags : null,
        user_id: user.id
      }

      if (isNew || !note) {
        const { data, error } = await supabase
          .from('notes')
          .insert([noteData])
          .select()
          .single()

        if (error) throw error
        
        // Redirect to the new note
        router.replace(`/notes/${data.id}`)
      } else {
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', note.id)

        if (error) throw error
      }

      setSaveStatus('saved')
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving note:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }, [title, content, tags, user, note, isNew, router])

  // Debounced auto-save
  useEffect(() => {
    if (!isNew && (title !== (note?.title || '') || content !== (note?.content || '') || JSON.stringify(tags) !== JSON.stringify(note?.tags || []))) {
      setSaveStatus('unsaved')
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveNote()
      }, 2000) // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content, tags, note, isNew, saveNote])

  // Manual save
  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveNote()
  }, [saveNote])

  // Delete note
  const handleDelete = async () => {
    if (!note || !confirm('Are you sure you want to delete this note?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id)

      if (error) throw error
      
      router.push('/notes')
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  // Toggle pin
  const handleTogglePin = async () => {
    if (!note) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', note.id)

      if (error) throw error
      
      // Update local state
      note.is_pinned = !note.is_pinned
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault()
      setIsPreview(!isPreview)
    }
  }, [handleSave, isPreview])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Focus title on new note
  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus()
    }
  }, [isNew])

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Saved'
      case 'unsaved':
        return 'Unsaved changes'
      case 'error':
        return 'Error saving'
      default:
        return ''
    }
  }

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-600'
      case 'saved':
        return 'text-green-600'
      case 'unsaved':
        return 'text-orange-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/notes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>
              {note ? (
                <>
                  Created {new Date(note.created_at).toLocaleDateString()} • 
                  Updated {new Date(note.updated_at).toLocaleDateString()}
                </>
              ) : (
                'New note'
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={cn("text-sm", getSaveStatusColor())}>
            {getSaveStatusText()}
          </span>
          
          {!isNew && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePin}
                className="text-gray-600 hover:text-yellow-600"
              >
                {note?.is_pinned ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
                className="text-gray-600"
              >
                {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-gray-600 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gradient-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Title */}
        <Input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-2xl font-bold border-none shadow-none p-0 mb-4 focus-visible:ring-0"
        />

        {/* Tags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-sm cursor-pointer hover:bg-red-50 hover:border-red-200"
                onClick={() => removeTag(tag)}
              >
                <Hash className="h-3 w-3 mr-1" />
                {tag}
                <span className="ml-1 text-red-500">×</span>
              </Badge>
            ))}
            <div className="flex items-center space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tag..."
                className="w-32 h-7 text-sm"
              />
              <Button
                type="button"
                onClick={addTag}
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Content Editor/Preview */}
        <div className="flex-1 overflow-hidden">
          {isPreview ? (
            <div className="h-full overflow-y-auto prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*No content yet*'}
              </ReactMarkdown>
            </div>
          ) : (
            <TextareaAutosize
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note... You can use Markdown formatting!"
              className="w-full h-full resize-none border-none shadow-none p-0 focus-visible:ring-0 text-sm leading-relaxed"
            />
          )}
        </div>
      </div>

      {/* Help text */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Use **bold**, *italic*, `code`, # headings, - lists, and more Markdown syntax
          </div>
          <div>
            ⌘S to save • ⌘P to preview • {content.split(' ').filter(Boolean).length} words
          </div>
        </div>
      </div>
    </div>
  )
}
