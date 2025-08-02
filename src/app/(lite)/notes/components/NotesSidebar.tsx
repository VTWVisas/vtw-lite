'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  StickyNote, 
  Calendar, 
  Hash, 
  FileText,
  Clock,
  Star
} from 'lucide-react'
import Link from 'next/link'
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

interface NotesSidebarProps {
  notes: Note[]
  selectedNoteId?: string
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedFilter: string
  onFilterChange: (filter: string) => void
}

export default function NotesSidebar({ 
  notes, 
  selectedNoteId, 
  searchQuery, 
  onSearchChange,
  selectedFilter,
  onFilterChange 
}: NotesSidebarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value)
    onSearchChange(value)
  }

  // Filter and search logic
  const filteredNotes = useMemo(() => {
    let filtered = notes

    // Apply filters
    switch (selectedFilter) {
      case 'today':
        const today = new Date().toDateString()
        filtered = notes.filter(note => 
          new Date(note.updated_at).toDateString() === today
        )
        break
      case 'recent':
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        filtered = notes.filter(note => 
          new Date(note.updated_at) >= lastWeek
        )
        break
      case 'pinned':
        filtered = notes.filter(note => note.is_pinned)
        break
      case 'untagged':
        filtered = notes.filter(note => !note.tags || note.tags.length === 0)
        break
      default:
        filtered = notes
    }

    // Apply search
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase().trim()
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        (note.tags && note.tags.some(tag => 
          tag.toLowerCase().includes(query)
        ))
      )
    }

    return filtered.sort((a, b) => {
      // Pinned notes first
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      // Then by updated date
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [notes, selectedFilter, localSearchQuery])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const truncateContent = (content: string, maxLength: number = 80) => {
    const plainText = content.replace(/[#*`_~\[\]]/g, '').trim()
    if (plainText.length <= maxLength) return plainText
    return plainText.slice(0, maxLength) + '...'
  }

  const filters = [
    { id: 'all', label: 'All Notes', icon: FileText, count: notes.length },
    { id: 'recent', label: 'Recent', icon: Clock, count: notes.filter(n => {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      return new Date(n.updated_at) >= lastWeek
    }).length },
    { id: 'today', label: 'Today', icon: Calendar, count: notes.filter(n => 
      new Date(n.updated_at).toDateString() === new Date().toDateString()
    ).length },
    { id: 'pinned', label: 'Pinned', icon: Star, count: notes.filter(n => n.is_pinned).length },
    { id: 'untagged', label: 'Untagged', icon: Hash, count: notes.filter(n => !n.tags || n.tags.length === 0).length },
  ]

  return (
    <div className="w-80 h-full border-r border-gray-200 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <StickyNote className="h-5 w-5 mr-2 text-yellow-600" />
            Notes
          </h2>
          <Button size="sm" asChild className="gradient-primary">
            <Link href="/notes/new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-gray-100 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="space-y-1">
          {filters.map((filter) => {
            const Icon = filter.icon
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                  selectedFilter === filter.id
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {filter.label}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {filter.count}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-6 text-center">
            <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No notes found</h3>
            <p className="text-xs text-gray-500">
              {localSearchQuery ? 'Try a different search term' : 'Create your first note'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className={cn(
                  "block p-3 rounded-lg border transition-all duration-200 mb-2",
                  selectedNoteId === note.id
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className={cn(
                      "text-sm font-medium line-clamp-1",
                      selectedNoteId === note.id ? "text-blue-900" : "text-gray-900"
                    )}>
                      {note.is_pinned && <Star className="inline h-3 w-3 mr-1 text-yellow-500 fill-current" />}
                      {note.title || 'Untitled'}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatDate(note.updated_at)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {truncateContent(note.content)}
                  </p>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          {localSearchQuery && ` matching "${localSearchQuery}"`}
        </div>
      </div>
    </div>
  )
}
