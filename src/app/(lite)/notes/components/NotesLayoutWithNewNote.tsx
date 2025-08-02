'use client'

import { useState } from 'react'
import NotesSidebar from './NotesSidebar'
import NoteEditor from './NoteEditor'

interface Note {
  id: string
  title: string
  content: string
  tags: string[] | null
  created_at: string
  updated_at: string
  is_pinned?: boolean
}

interface NotesLayoutWithNewNoteProps {
  notes: Note[]
}

export default function NotesLayoutWithNewNote({ notes }: NotesLayoutWithNewNoteProps) {
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

      {/* Note Editor for new note */}
      <NoteEditor isNew={true} />
    </div>
  )
}
