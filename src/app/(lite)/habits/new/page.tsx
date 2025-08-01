'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Target, ArrowLeft, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

type HabitData = {
  name: string
  description: string | null
  frequency: string
  user_id: string
}

export default function NewHabitPage() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const name = formData.get('name') as string
      const description = formData.get('description') as string
      const frequency = formData.get('frequency') as string

      if (!name.trim()) {
        setError('Habit name is required')
        setLoading(false)
        return
      }

      const habitData: HabitData = {
        name: name.trim(),
        description: description.trim() || null,
        frequency,
        user_id: user?.id || '',
      }

      const { error: insertError } = await supabase
        .from('habits')
        .insert([habitData])

      if (insertError) throw insertError

      router.push('/habits')
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
          <Link href="/habits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Habits
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Target className="h-8 w-8 text-purple-600 mr-3" />
            New Habit
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Create a new habit to track your progress
          </p>
        </div>
      </div>

      <Card className="border-0 atlassian-shadow">
        <CardHeader>
          <CardTitle>Habit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Habit Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Drink 8 glasses of water"
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add more details about this habit..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select name="frequency" defaultValue="daily">
                <SelectTrigger>
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">📅 Daily</SelectItem>
                  <SelectItem value="weekly">📆 Weekly</SelectItem>
                  <SelectItem value="monthly">🗓️ Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/habits">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading} className="gradient-primary">
                {loading ? 'Creating...' : 'Create Habit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-0 atlassian-shadow bg-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-purple-900 mb-2">Habit Building Tips</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Start small - aim for 2-minute habits initially</li>
                <li>• Stack habits with existing routines</li>
                <li>• Focus on consistency over perfection</li>
                <li>• Track your progress to maintain motivation</li>
                <li>• Be patient - habits take 21-66 days to form</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
