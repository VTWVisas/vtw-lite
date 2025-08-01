import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch goals from database
  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No target date'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Target className="h-8 w-8 text-blue-600 mr-3" />
            Goals
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Track your goals and achieve your dreams
          </p>
        </div>
        <Button asChild className="gradient-primary">
          <Link href="/goals/new">
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {goals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Goals</p>
                  <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {goals.filter(goal => goal.status === 'active').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {goals.filter(goal => goal.status === 'completed').length}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 atlassian-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {goals.length > 0 
                      ? Math.round(goals.reduce((acc, goal) => acc + goal.progress_percentage, 0) / goals.length)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals List */}
      {error ? (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading goals: {error.message}</p>
          </CardContent>
        </Card>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="border-0 atlassian-shadow card-hover">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status}
                      </Badge>
                    </div>
                    {goal.description && (
                      <CardDescription className="text-gray-600">
                        {goal.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {goal.category && (
                      <span className="px-2 py-1 bg-gray-100 rounded-full">
                        {goal.category}
                      </span>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(goal.target_date)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-medium text-gray-900">
                        {goal.progress_percentage}%
                      </span>
                    </div>
                    <Progress value={goal.progress_percentage} className="h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Created {new Date(goal.created_at).toLocaleDateString()}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/goals/${goal.id}`}>View Details</Link>
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
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No goals yet</h3>
            <p className="text-gray-600 mb-6">
              Start your journey by creating your first goal. What would you like to achieve?
            </p>
            <Button asChild className="gradient-primary">
              <Link href="/goals/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
