import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotesLayoutWithNote from '../components/NotesLayoutWithNote'

interface NotePageProps {
  params: Promise<{ noteId: string }>
}

export default async function NotePage({ params }: NotePageProps) {
  const { noteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch all notes for sidebar
  const { data: allNotes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Fetch specific note
  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single()

  if (error || !note) {
    redirect('/notes')
  }

  return (
    <NotesLayoutWithNote 
      notes={allNotes || []} 
      selectedNote={note}
    />
  )
}
