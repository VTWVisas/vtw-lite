'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, ArrowLeft, Lightbulb, Brain } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

type JournalData = {
  title: string | null
  content: string
  mood: string
  tags: string[]
  user_id: string
}

export default function NewJournalEntryPage() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const title = formData.get('title') as string
      const content = formData.get('content') as string
      const mood = formData.get('mood') as string

      if (!content.trim()) {
        setError('Content is required')
        setLoading(false)
        return
      }

      const journalData: JournalData = {
        title: title.trim() || null,
        content: content.trim(),
        mood,
        tags,
        user_id: user?.id || '',
      }

      const { error: insertError } = await supabase
        .from('journal_entries')
        .insert([journalData])

      if (insertError) throw insertError

      router.push('/journal')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/journal">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Journal
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
            New Journal Entry
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Reflect on your day and capture your thoughts
          </p>
        </div>
      </div>

      <Card className="border-0 atlassian-shadow">
        <CardHeader>
          <CardTitle>Journal Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Give your entry a title..."
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">How are you feeling? *</Label>
                <Select name="mood" defaultValue="okay">
                  <SelectTrigger>
                    <SelectValue placeholder="Select your mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazing">🤩 Amazing</SelectItem>
                    <SelectItem value="good">😊 Good</SelectItem>
                    <SelectItem value="okay">😐 Okay</SelectItem>
                    <SelectItem value="bad">😔 Bad</SelectItem>
                    <SelectItem value="terrible">😢 Terrible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Your thoughts *</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="What's on your mind? How was your day? What are you grateful for?"
                required
                rows={12}
                className="min-h-[300px]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/journal">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading} className="gradient-primary">
                {loading ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 atlassian-shadow bg-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-indigo-900 mb-2">Journaling Tips</h3>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• Write freely without worrying about grammar</li>
                  <li>• Focus on how events made you feel</li>
                  <li>• Include what you&apos;re grateful for</li>
                  <li>• Note any insights or lessons learned</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-purple-900 mb-2">Coming Soon: AI Insights</h3>
                <p className="text-sm text-purple-800">
                  Our AI will analyze your entries to provide personalized insights about your mood patterns, growth areas, and positive trends.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
