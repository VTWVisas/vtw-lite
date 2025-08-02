'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  Star, 
  StarOff, 
  Trash2, 
  Copy, 
  ExternalLink,
  Edit,
  Share
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Note {
  id: string
  title: string
  content: string
  tags: string[] | null
  created_at: string
  updated_at: string
  is_pinned?: boolean
}

interface NoteActionsProps {
  note: Note
  onUpdate?: (updatedNote: Note) => void
  className?: string
}

export default function NoteActions({ note, onUpdate, className }: NoteActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleTogglePin = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', note.id)

      if (error) throw error
      
      const updatedNote = { ...note, is_pinned: !note.is_pinned }
      onUpdate?.(updatedNote)
      setIsOpen(false)
    } catch (error) {
      console.error('Error toggling pin:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return

    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(note.content)
      setIsOpen(false)
      // You could add a toast notification here
    } catch (error) {
      console.error('Error copying content:', error)
    }
  }

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/notes/${note.id}`
      await navigator.clipboard.writeText(url)
      setIsOpen(false)
      // You could add a toast notification here
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const handleEdit = () => {
    router.push(`/notes/${note.id}`)
    setIsOpen(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.content.slice(0, 100) + '...',
          url: `${window.location.origin}/notes/${note.id}`
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying link
      handleCopyLink()
    }
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit note
            </button>
            
            <button
              onClick={handleTogglePin}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center"
            >
              {note.is_pinned ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  Unpin note
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Pin note
                </>
              )}
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={handleCopyContent}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy content
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copy link
            </button>

            <button
              onClick={handleShare}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 focus:bg-red-50 focus:outline-none flex items-center text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete note
            </button>
          </div>
        </>
      )}
    </div>
  )
}
