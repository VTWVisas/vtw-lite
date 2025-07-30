import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, Calendar, TrendingUp, Flame } from 'lucide-react'
import Link from 'next/link'

type HabitEntry = {
  id: string
  completed_at: string
  notes?: string
}

export default async function HabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch habits with recent entries
  const { data: habits, error } = await supabase
    .from('habits')
    .select(`
      *,
      habit_entries!habit_entries_habit_id_fkey(
        id,
        completed_at,
        notes
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'bg-blue-100 text-blue-800'
      case 'weekly':
        return 'bg-green-100 text-green-800'
      case 'monthly':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateStreak = (entries: HabitEntry[]) => {
    if (!entries || entries.length === 0) return 0
    
    const sortedEntries = entries
      .map(entry => new Date(entry.completed_at).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    
    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    // Check if completed today or yesterday
    if (sortedEntries[0] === today || sortedEntries[0] === yesterday) {
      streak = 1
      let currentDate = new Date(sortedEntries[0])
      
      for (let i = 1; i < sortedEntries.length; i++) {
        const prevDate = new Date(currentDate.getTime() - 86400000).toDateString()
        if (sortedEntries[i] === prevDate) {
          streak++
          currentDate = new Date(sortedEntries[i])
        } else {
          break
        }
      }
    }
    
    return streak
  }

  const isCompletedToday = (entries: HabitEntry[]) => {
    const today = new Date().toDateString()
    return entries.some(entry => 
      new Date(entry.completed_at).toDateString() === today
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Target className="h-8 w-8 text-purple-600 mr-3" />
            Habits
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Build positive habits and track your streaks
          </p>
        </div>
        <Button asChild className="gradient-primary">
          <Link href="/habits/new">
            <Plus className="h-4 w-4 mr-2" />
            New Habit
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {habits && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Habits</p>
                  <p className="text-2xl font-bold text-gray-900">{habits.length}</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">
                    {habits.filter(habit => isCompletedToday(habit.habit_entries || [])).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Best Streak</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.max(...habits.map(habit => calculateStreak(habit.habit_entries || [])), 0)}
                  </p>
                </div>
                <Flame className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {habits.reduce((total, habit) => total + (habit.habit_entries?.length || 0), 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Habits List */}
      {error ? (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading habits: {error.message}</p>
          </CardContent>
        </Card>
      ) : habits && habits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => {
            const streak = calculateStreak(habit.habit_entries || [])
            const completedToday = isCompletedToday(habit.habit_entries || [])
            
            return (
              <Card key={habit.id} className="border-0 atlassian-shadow card-hover">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{habit.name}</h3>
                      <Badge className={getFrequencyBadge(habit.frequency)}>
                        {habit.frequency}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-orange-600 mb-1">
                        <Flame className="h-4 w-4 mr-1" />
                        <span className="font-bold">{streak}</span>
                      </div>
                      <p className="text-xs text-gray-500">day streak</p>
                    </div>
                  </div>
                  
                  {habit.description && (
                    <p className="text-gray-600 text-sm mb-4">{habit.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {habit.habit_entries?.length || 0} total entries
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/habits/${habit.id}`}>View</Link>
                      </Button>
                      {!completedToday && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Mark Done
                        </Button>
                      )}
                      {completedToday && (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Done Today
                        </Badge>
                      )}
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
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h3>
            <p className="text-gray-600 mb-6">
              Start building positive habits to improve your daily routine.
            </p>
            <Button asChild className="gradient-primary">
              <Link href="/habits/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Habit
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
