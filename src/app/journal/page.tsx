import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, Calendar, Heart, Brain } from 'lucide-react'
import Link from 'next/link'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch journal entries
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'amazing':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'okay':
        return 'bg-yellow-100 text-yellow-800'
      case 'bad':
        return 'bg-orange-100 text-orange-800'
      case 'terrible':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'amazing':
        return '🤩'
      case 'good':
        return '😊'
      case 'okay':
        return '😐'
      case 'bad':
        return '😔'
      case 'terrible':
        return '😢'
      default:
        return '😐'
    }
  }

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  // Get current month entries
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyEntries = entries?.filter(entry => {
    const entryDate = new Date(entry.created_at)
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear
  }) || []

  // Calculate mood stats
  const moodCounts = entries?.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const totalEntries = entries?.length || 0
  const averageMoodValue = entries?.length ? 
    entries.reduce((sum, entry) => {
      const moodValues = { terrible: 1, bad: 2, okay: 3, good: 4, amazing: 5 }
      return sum + (moodValues[entry.mood as keyof typeof moodValues] || 3)
    }, 0) / entries.length : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            Journal
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Reflect on your thoughts, feelings, and experiences
          </p>
        </div>
        <Button asChild className="gradient-primary">
          <Link href="/journal/new">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
              </div>
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">{monthlyEntries.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Mood</p>
                <p className="text-2xl font-bold text-purple-600">
                  {averageMoodValue.toFixed(1)}/5
                </p>
              </div>
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Insights</p>
                <p className="text-2xl font-bold text-orange-600">
                  {entries?.filter(e => e.ai_insights).length || 0}
                </p>
              </div>
              <Brain className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood Overview */}
      {Object.keys(moodCounts).length > 0 && (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(moodCounts).map(([mood, count]) => (
                <div key={mood} className="flex items-center gap-2">
                  <span className="text-2xl">{getMoodEmoji(mood)}</span>
                  <Badge className={getMoodColor(mood)}>
                    {mood}: {String(count)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journal Entries */}
      {error ? (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading entries: {error.message}</p>
          </CardContent>
        </Card>
      ) : entries && entries.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-0 atlassian-shadow card-hover">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                      <Badge className={getMoodColor(entry.mood)}>
                        {entry.mood}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {entry.title && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{entry.title}</h3>
                    )}
                    
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {truncateContent(entry.content)}
                    </p>
                    
                    {entry.ai_insights && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">AI Insights</h4>
                            <p className="text-blue-800 text-sm">{entry.ai_insights}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(entry.tags as string[]).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/journal/${entry.id}`}>Read More</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/journal/${entry.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No journal entries yet</h3>
            <p className="text-gray-600 mb-6">
              Start your journaling journey to track your thoughts and feelings.
            </p>
            <Button asChild className="gradient-primary">
              <Link href="/journal/new">
                <Plus className="h-4 w-4 mr-2" />
                Write Your First Entry
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
