'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, ArrowLeft, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

type FinanceData = {
  type: string
  category: string
  amount: number
  description: string
  date: string
  user_id: string
}

export default function NewFinanceRecordPage() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('expense')

  const expenseCategories = [
    'food', 'transportation', 'housing', 'entertainment', 
    'healthcare', 'education', 'shopping', 'other'
  ]

  const incomeCategories = [
    'salary', 'freelance', 'business', 'investment', 'other'
  ]

  const savingsCategories = [
    'emergency fund', 'retirement', 'vacation', 'goals', 'other'
  ]

  const investmentCategories = [
    'stocks', 'bonds', 'crypto', 'real estate', 'other'
  ]

  const getCategories = () => {
    switch (selectedType) {
      case 'income':
        return incomeCategories
      case 'savings':
        return savingsCategories
      case 'investment':
        return investmentCategories
      default:
        return expenseCategories
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const type = formData.get('type') as string
      const category = formData.get('category') as string
      const amount = parseFloat(formData.get('amount') as string)
      const description = formData.get('description') as string
      const date = formData.get('date') as string

      if (!description.trim()) {
        setError('Description is required')
        setLoading(false)
        return
      }

      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount')
        setLoading(false)
        return
      }

      const financeData: FinanceData = {
        type,
        category,
        amount,
        description: description.trim(),
        date,
        user_id: user?.id || '',
      }

      const { error: insertError } = await supabase
        .from('finance_records')
        .insert([financeData])

      if (insertError) throw insertError

      router.push('/finance')
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
          <Link href="/finance">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            New Financial Record
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Add a new income, expense, or investment record
          </p>
        </div>
      </div>

      <Card className="border-0 atlassian-shadow">
        <CardHeader>
          <CardTitle>Record Details</CardTitle>
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
                <Label htmlFor="type">Type *</Label>
                <Select 
                  name="type" 
                  defaultValue="expense" 
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">💰 Income</SelectItem>
                    <SelectItem value="expense">💸 Expense</SelectItem>
                    <SelectItem value="savings">🏦 Savings</SelectItem>
                    <SelectItem value="investment">📈 Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="What was this for?"
                required
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/finance">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading} className="gradient-primary">
                {loading ? 'Adding...' : 'Add Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-0 atlassian-shadow bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900 mb-2">Financial Tracking Tips</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Record transactions as soon as they happen</li>
                <li>• Be consistent with your categories</li>
                <li>• Include detailed descriptions for better tracking</li>
                <li>• Review your spending patterns monthly</li>
                <li>• Set budgets and track against them</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
