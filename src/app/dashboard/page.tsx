import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Target, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  StickyNote,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch data from all modules
  const [
    { data: goals },
    { data: tasks },
    { data: habits },
    { data: financeRecords },
    { data: journalEntries },
    { data: notes }
  ] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', user.id),
    supabase.from('tasks').select('*').eq('user_id', user.id),
    supabase.from('habits').select('*').eq('user_id', user.id),
    supabase.from('finance_records').select('*').eq('user_id', user.id),
    supabase.from('journal_entries').select('*').eq('user_id', user.id),
    supabase.from('notes').select('*').eq('user_id', user.id)
  ])

  // Calculate stats
  const activeGoals = goals?.filter(g => g.status === 'active').length || 0
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
  const totalTasks = tasks?.length || 0
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Today's data
  const today = new Date().toDateString()
  const todayTasks = tasks?.filter(task => {
    if (!task.due_date) return false
    return new Date(task.due_date).toDateString() === today
  }) || []

  // Finance stats
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyRecords = financeRecords?.filter(record => {
    const recordDate = new Date(record.date)
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
  }) || []

  const monthlyIncome = monthlyRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
  const monthlyExpenses = monthlyRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-blue-100">
          Here&apos;s what&apos;s happening in your Life OS today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Goals</p>
                <p className="text-2xl font-bold text-green-600">{activeGoals}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Task Completion</p>
                <p className="text-2xl font-bold text-blue-600">{taskCompletionRate}%</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-orange-600">{todayTasks.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Balance</p>
                <p className={`text-2xl font-bold ${(monthlyIncome - monthlyExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(monthlyIncome - monthlyExpenses).toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 atlassian-shadow">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Link href="/goals/new">
                <Target className="h-6 w-6 text-green-600" />
                <span className="text-xs">Add Goal</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Link href="/tasks/new">
                <CheckSquare className="h-6 w-6 text-blue-600" />
                <span className="text-xs">Add Task</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Link href="/habits/new">
                <Calendar className="h-6 w-6 text-purple-600" />
                <span className="text-xs">Add Habit</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Link href="/finance/new">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span className="text-xs">Log Finance</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Link href="/journal/new">
                <BookOpen className="h-6 w-6 text-indigo-600" />
                <span className="text-xs">Write Journal</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Link href="/notes/new">
                <StickyNote className="h-6 w-6 text-yellow-600" />
                <span className="text-xs">Create Note</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 atlassian-shadow card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 text-green-600 mr-2" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Goals:</span>
                <span className="font-medium">{goals?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active:</span>
                <span className="font-medium text-green-600">{activeGoals}</span>
              </div>
              <Button size="sm" asChild className="w-full mt-3">
                <Link href="/goals">View Goals</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <CheckSquare className="h-5 w-5 text-blue-600 mr-2" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Tasks:</span>
                <span className="font-medium">{totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Due Today:</span>
                <span className="font-medium text-orange-600">{todayTasks.length}</span>
              </div>
              <Button size="sm" asChild className="w-full mt-3">
                <Link href="/tasks">View Tasks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Habits:</span>
                <span className="font-medium">{habits?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active:</span>
                <span className="font-medium text-purple-600">{habits?.length || 0}</span>
              </div>
              <Button size="sm" asChild className="w-full mt-3">
                <Link href="/habits">View Habits</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              Finance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Records:</span>
                <span className="font-medium">{financeRecords?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Month:</span>
                <span className={`font-medium ${(monthlyIncome - monthlyExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(monthlyIncome - monthlyExpenses).toFixed(0)}
                </span>
              </div>
              <Button size="sm" asChild className="w-full mt-3">
                <Link href="/finance">View Finance</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
              Journal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Entries:</span>
                <span className="font-medium">{journalEntries?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Month:</span>
                <span className="font-medium text-blue-600">
                  {journalEntries?.filter(entry => {
                    const entryDate = new Date(entry.created_at)
                    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear
                  }).length || 0}
                </span>
              </div>
              <Button size="sm" asChild className="w-full mt-3">
                <Link href="/journal">View Journal</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <StickyNote className="h-5 w-5 text-yellow-600 mr-2" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Notes:</span>
                <span className="font-medium">{notes?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created Today:</span>
                <span className="font-medium text-yellow-600">
                  {notes?.filter(note => 
                    new Date(note.created_at).toDateString() === today
                  ).length || 0}
                </span>
              </div>
              <Button size="sm" asChild className="w-full mt-3">
                <Link href="/notes">View Notes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
