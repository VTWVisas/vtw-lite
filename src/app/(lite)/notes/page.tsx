import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotesLayout from './components/NotesLayout'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch notes
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching notes:', error)
    return <div>Error loading notes</div>
  }

  return <NotesLayout notes={notes || []} />
}
