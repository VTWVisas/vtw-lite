'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Note {
  id: string
  title: string
  content: string
  tags: string[] | null
  created_at: string
  updated_at: string
}

interface NotesSearchProps {
  notes: Note[]
  onResultClick: (note: Note) => void
  className?: string
}

export default function NotesSearch({ notes, onResultClick, className }: NotesSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const searchResults = useMemo(() => {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase().trim()
    
    return notes
      .filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        (note.tags && note.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        ))
      )
      .slice(0, 10) // Limit to 10 results
  }, [notes, query])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(value.trim().length > 0)
  }

  const handleResultClick = (note: Note) => {
    setQuery('')
    setIsOpen(false)
    onResultClick(note)
  }

  const clearSearch = () => {
    setQuery('')
    setIsOpen(false)
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    
    const regex = new RegExp(`(${highlight})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    
    // Try to find the search term and show context around it
    const searchTerm = query.toLowerCase().trim()
    const index = content.toLowerCase().indexOf(searchTerm)
    
    if (index !== -1) {
      const start = Math.max(0, index - 50)
      const end = Math.min(content.length, index + searchTerm.length + 50)
      return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '')
    }
    
    return content.slice(0, maxLength) + '...'
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search notes..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(query.trim().length > 0)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Results */}
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleResultClick(note)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {highlightText(note.title, query)}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {highlightText(truncateContent(note.content), query)}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags
                            .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
                            .slice(0, 3)
                            .map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {highlightText(`#${tag}`, query)}
                              </Badge>
                            ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Updated {new Date(note.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notes found for &ldquo;{query}&rdquo;</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
