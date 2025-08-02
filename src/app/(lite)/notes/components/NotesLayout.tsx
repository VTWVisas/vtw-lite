'use client'

import { useState } from 'react'
import { StickyNote, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import NotesSidebar from './NotesSidebar'

interface Note {
  id: string
  title: string
  content: string
  tags: string[] | null
  created_at: string
  updated_at: string
  is_pinned?: boolean
}

interface NotesLayoutProps {
  notes: Note[]
}

export default function NotesLayout({ notes }: NotesLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg overflow-hidden atlassian-shadow">
      {/* Sidebar */}
      <NotesSidebar
        notes={notes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <StickyNote className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to Notes
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Select a note from the sidebar to view it, or create a new one to get started.
          </p>
          <Button asChild className="gradient-primary">
            <Link href="/notes/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Note
            </Link>
          </Button>
        </div>
        
        {/* Quick stats */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{notes.length}</div>
            <div className="text-sm text-gray-500">Total Notes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {notes.filter(note => {
                const today = new Date().toDateString()
                return new Date(note.updated_at).toDateString() === today
              }).length}
            </div>
            <div className="text-sm text-gray-500">Updated Today</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {notes.reduce((tags, note) => {
                if (note.tags) {
                  note.tags.forEach(tag => {
                    if (!tags.includes(tag)) tags.push(tag)
                  })
                }
                return tags
              }, [] as string[]).length}
            </div>
            <div className="text-sm text-gray-500">Unique Tags</div>
          </div>
        </div>
      </div>
    </div>
  )
}
