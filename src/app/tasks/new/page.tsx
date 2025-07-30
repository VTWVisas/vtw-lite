'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckSquare, ArrowLeft, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

type Goal = {
  id: string
  title: string
}

type TaskData = {
  title: string
  description: string | null
  priority: string
  status: string
  user_id: string
  due_date: string | null
  goal_id: string | null
}

export default function NewTaskPage() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [error, setError] = useState('')

  // Fetch goals for linking
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return
      
      const supabase = createClient()
      const { data } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status', 'active')
      setGoals(data || [])
    }

    fetchGoals()
  }, [user])

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const priority = formData.get('priority') as string
      const due_date = formData.get('due_date') as string
      const goal_id = formData.get('goal_id') as string

      if (!title.trim()) {
        setError('Title is required')
        setLoading(false)
        return
      }

      const taskData: TaskData = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: 'todo',
        user_id: user?.id || '',
        due_date: due_date || null,
        goal_id: goal_id || null,
      }

      const { error: insertError } = await supabase
        .from('tasks')
        .insert([taskData])

      if (insertError) throw insertError

      router.push('/tasks')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CheckSquare className="h-8 w-8 text-green-600 mr-3" />
            New Task
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Create a new task to track your progress
          </p>
        </div>
      </div>

      <Card className="border-0 atlassian-shadow">
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="What do you need to do?"
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add more details about this task..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {goals.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="goal_id">Link to Goal (Optional)</Label>
                <Select name="goal_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal to link this task" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/tasks">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading} className="gradient-primary">
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-0 atlassian-shadow bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Task Management Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Break large tasks into smaller, actionable steps</li>
                <li>• Set realistic deadlines to maintain momentum</li>
                <li>• Use priority levels to focus on what matters most</li>
                <li>• Link tasks to goals to track progress toward bigger objectives</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
