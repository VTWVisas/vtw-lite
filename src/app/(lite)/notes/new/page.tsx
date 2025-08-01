'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StickyNote, ArrowLeft, Lightbulb, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

type NoteData = {
  title: string
  content: string
  tags: string[]
  user_id: string
}

export default function NewNotePage() {
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

      if (!title.trim()) {
        setError('Title is required')
        setLoading(false)
        return
      }

      if (!content.trim()) {
        setError('Content is required')
        setLoading(false)
        return
      }

      const noteData: NoteData = {
        title: title.trim(),
        content: content.trim(),
        tags,
        user_id: user?.id || '',
      }

      const { error: insertError } = await supabase
        .from('notes')
        .insert([noteData])

      if (insertError) throw insertError

      router.push('/notes')
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
          <Link href="/notes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <StickyNote className="h-8 w-8 text-yellow-600 mr-3" />
            New Note
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Capture ideas and connect your knowledge
          </p>
        </div>
      </div>

      <Card className="border-0 atlassian-shadow">
        <CardHeader>
          <CardTitle>Note Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Give your note a descriptive title..."
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Write your note content here... Use [[Note Title]] to link to other notes."
                required
                rows={15}
                className="min-h-[400px] font-mono text-sm"
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
                      className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-yellow-600 hover:text-yellow-800"
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
                <Link href="/notes">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading} className="gradient-primary">
                {loading ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 atlassian-shadow bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-2">Note Taking Tips</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Use descriptive titles for easy searching</li>
                  <li>• Add relevant tags to categorize notes</li>
                  <li>• Break down complex topics into smaller notes</li>
                  <li>• Review and update notes regularly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <LinkIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Linking Notes</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use [[Note Title]] syntax to link notes</li>
                  <li>• Links help build knowledge connections</li>
                  <li>• Create a web of interconnected ideas</li>
                  <li>• Perfect for building a personal wiki</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
