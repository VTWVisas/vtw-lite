import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotesLayoutWithNewNote from '../components/NotesLayoutWithNewNote'

export default async function NewNotePage() {
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

  return <NotesLayoutWithNewNote notes={allNotes || []} />
}
