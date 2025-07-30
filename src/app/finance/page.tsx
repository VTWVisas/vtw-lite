import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Plus, TrendingUp, TrendingDown, PieChart } from 'lucide-react'
import Link from 'next/link'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch finance records
  const { data: records, error } = await supabase
    .from('finance_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-800'
      case 'expense':
        return 'bg-red-100 text-red-800'
      case 'investment':
        return 'bg-blue-100 text-blue-800'
      case 'savings':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'food': '🍔',
      'transportation': '🚗',
      'housing': '🏠',
      'entertainment': '🎬',
      'healthcare': '⚕️',
      'education': '📚',
      'shopping': '🛒',
      'salary': '💰',
      'freelance': '💼',
      'investment': '📈',
      'other': '📋'
    }
    return icons[category] || '📋'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Calculate totals
  const totalIncome = records?.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0) || 0
  const totalExpenses = records?.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0) || 0
  const totalSavings = records?.filter(r => r.type === 'savings').reduce((sum, r) => sum + r.amount, 0) || 0
  const totalInvestments = records?.filter(r => r.type === 'investment').reduce((sum, r) => sum + r.amount, 0) || 0

  const netWorth = totalIncome - totalExpenses + totalSavings + totalInvestments

  // Get current month records
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyRecords = records?.filter(record => {
    const recordDate = new Date(record.date)
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
  }) || []

  const monthlyIncome = monthlyRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
  const monthlyExpenses = monthlyRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            Finance
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Track your income, expenses, and financial goals
          </p>
        </div>
        <Button asChild className="gradient-primary">
          <Link href="/finance/new">
            <Plus className="h-4 w-4 mr-2" />
            New Record
          </Link>
        </Button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Worth</p>
                <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netWorth)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyIncome)}
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
                <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(monthlyExpenses)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Balance</p>
                <p className={`text-2xl font-bold ${(monthlyIncome - monthlyExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(monthlyIncome - monthlyExpenses)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">All Records</Button>
        <Button variant="outline" size="sm">Income</Button>
        <Button variant="outline" size="sm">Expenses</Button>
        <Button variant="outline" size="sm">Savings</Button>
        <Button variant="outline" size="sm">Investments</Button>
        <Button variant="outline" size="sm">This Month</Button>
      </div>

      {/* Records List */}
      {error ? (
        <Card className="border-0 atlassian-shadow">
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading records: {error.message}</p>
          </CardContent>
        </Card>
      ) : records && records.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {records.map((record) => (
            <Card key={record.id} className="border-0 atlassian-shadow card-hover">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(record.category)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{record.description}</h3>
                      <Badge className={getTypeColor(record.type)}>
                        {record.type}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>Category: {record.category}</span>
                      <span>Date: {new Date(record.date).toLocaleDateString()}</span>
                      <span>Created: {new Date(record.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${
                      record.type === 'income' ? 'text-green-600' : 
                      record.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {record.type === 'expense' ? '-' : '+'}{formatCurrency(record.amount)}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/finance/${record.id}`}>Edit</Link>
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
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No financial records yet</h3>
            <p className="text-gray-600 mb-6">
              Start tracking your income and expenses to get insights into your financial health.
            </p>
            <Button asChild className="gradient-primary">
              <Link href="/finance/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Record
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
