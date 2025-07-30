import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StickyNote, Plus, Calendar, Hash, Search } from 'lucide-react'
import Link from 'next/link'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch notes
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  const extractLinks = (content: string) => {
    const linkRegex = /\[\[(.*?)\]\]/g
    const links = []
    let match
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[1])
    }
    return links
  }

  // Get today's notes
  const today = new Date().toDateString()
  const todayNotes = notes?.filter(note => 
    new Date(note.created_at).toDateString() === today
  ) || []

  // Get all unique tags
  const allTags = notes?.reduce((tags: string[], note) => {
    if (note.tags) {
      note.tags.forEach((tag: string) => {
        if (!tags.includes(tag)) {
          tags.push(tag)
        }
      })
    }
    return tags
  }, []) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <StickyNote className="h-8 w-8 text-yellow-600 mr-3" />
            Notes
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Capture ideas, thoughts, and connect your knowledge
          </p>
        </div>
        <Button asChild className="gradient-primary">
          <Link href="/notes/new">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Link>
        </Button>
      </div>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">{notes?.length || 0}</p>
              </div>
              <StickyNote className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Created Today</p>
                <p className="text-2xl font-bold text-blue-600">{todayNotes.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tags</p>
                <p className="text-2xl font-bold text-purple-600">{allTags.length}</p>
              </div>
              <Hash className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Linked Notes</p>
                <p className="text-2xl font-bold text-green-600">
                  {notes?.filter(note => extractLinks(note.content).length > 0).length || 0}
                </p>
              </div>
              <Search className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tag Cloud */}
      {allTags.length > 0 && (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-blue-50">
                  #{tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">All Notes</Button>
        <Button variant="outline" size="sm">Recent</Button>
        <Button variant="outline" size="sm">Today</Button>
        <Button variant="outline" size="sm">Linked</Button>
        <Button variant="outline" size="sm">Untagged</Button>
      </div>

      {/* Notes Grid */}
      {error ? (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading notes: {error.message}</p>
          </CardContent>
        </Card>
      ) : notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => {
            const links = extractLinks(note.content)
            
            return (
              <Card key={note.id} className="border-0 atlassian-shadow card-hover">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {note.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm line-clamp-4">
                      {truncateContent(note.content)}
                    </p>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(note.tags as string[]).slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {links.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Linked to:</p>
                        <div className="flex flex-wrap gap-1">
                          {links.slice(0, 2).map((link) => (
                            <Badge key={link} className="bg-blue-100 text-blue-800 text-xs">
                              {link}
                            </Badge>
                          ))}
                          {links.length > 2 && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              +{links.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-gray-500">
                        {note.content.split(' ').length} words
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/notes/${note.id}`}>View</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/notes/${note.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-12 text-center">
            <StickyNote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-600 mb-6">
              Start capturing your ideas and building your personal knowledge base.
            </p>
            <Button asChild className="gradient-primary">
              <Link href="/notes/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Note
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
