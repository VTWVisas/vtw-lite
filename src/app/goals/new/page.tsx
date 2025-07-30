import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Target, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewGoalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  async function createGoal(formData: FormData) {
    'use server'
    
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const targetDate = formData.get('target_date') as string
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/auth/signin')
    }
    
    const { error } = await supabase
      .from('goals')
      .insert([
        {
          user_id: user.id,
          title,
          description: description || null,
          category: category || null,
          target_date: targetDate || null,
          status: 'active',
          progress_percentage: 0
        }
      ])

    if (error) {
      console.error('Error creating goal:', error)
      // In a real app, you'd handle this error properly
      redirect('/goals/new?error=Could not create goal')
    }

    redirect('/goals')
  }

  const categories = [
    'Health & Fitness',
    'Career',
    'Education',
    'Finance',
    'Relationships',
    'Personal Development',
    'Hobbies',
    'Travel',
    'Other'
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/goals" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Goals
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Target className="h-8 w-8 text-blue-600 mr-3" />
          Create New Goal
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Define what you want to achieve and start tracking your progress
        </p>
      </div>

      {/* Form */}
      <Card className="border-0 atlassian-shadow">
        <CardHeader>
          <CardTitle>Goal Details</CardTitle>
          <CardDescription>
            Fill in the information about your goal. You can always edit this later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createGoal} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Learn Spanish, Run a marathon, Save $10,000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your goal in detail. What does success look like?"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  name="target_date"
                  type="date"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="gradient-primary flex-1">
                Create Goal
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/goals">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-0 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Goal Setting Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Make your goals specific and measurable</li>
            <li>• Set realistic but challenging targets</li>
            <li>• Break large goals into smaller milestones</li>
            <li>• Include a timeline to create urgency</li>
            <li>• Review and update your progress regularly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
