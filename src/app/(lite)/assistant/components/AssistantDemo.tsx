import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  MessageCircle, 
  Calendar, 
  Target, 
  Clock, 
  Mail,
  Smartphone,
  Bot,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

export default function AssistantDemo() {
  const features = [
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Automated notifications for tasks, deadlines, and time blocks',
      items: [
        'Daily productivity summaries',
        'Weekly performance reviews',
        'Task deadline alerts',
        'Time block notifications'
      ],
      color: 'bg-blue-100 text-blue-800'
    },
    {
      icon: MessageCircle,
      title: 'AI Chat Assistant',
      description: 'Conversational AI that understands your productivity patterns',
      items: [
        'Natural language queries',
        'Contextual insights',
        'Priority recommendations',
        'Progress analysis'
      ],
      color: 'bg-green-100 text-green-800'
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Intelligent goal monitoring and milestone suggestions',
      items: [
        'Progress visualization',
        'Deadline tracking',
        'Milestone reminders',
        'Achievement celebration'
      ],
      color: 'bg-purple-100 text-purple-800'
    },
    {
      icon: Clock,
      title: 'Time Management',
      description: 'Smart scheduling and time optimization',
      items: [
        'Schedule optimization',
        'Focus time blocks',
        'Break reminders',
        'Pomodoro integration'
      ],
      color: 'bg-orange-100 text-orange-800'
    }
  ]

  const sampleQueries = [
    {
      icon: Calendar,
      query: "What's my focus for today?",
      response: "Based on your tasks and schedule, focus on completing the project proposal first, then your 2 PM client meeting."
    },
    {
      icon: Target,
      query: "How are my goals progressing?",
      response: "You're 65% complete on your Q4 goals. The fitness goal is ahead of schedule, but the learning goal needs attention."
    },
    {
      icon: CheckCircle,
      query: "What tasks are overdue?",
      response: "You have 2 overdue tasks: 'Review budget report' (3 days) and 'Update team presentation' (1 day)."
    },
    {
      icon: Info,
      query: "Summarize my week",
      response: "Completed 12/15 tasks (80%), held 8 meetings, logged 25 Pomodoro sessions. Great productivity week!"
    }
  ]

  const notificationTypes = [
    {
      icon: Mail,
      type: 'Email',
      description: 'Daily summaries and important alerts',
      status: 'active'
    },
    {
      icon: Bell,
      type: 'In-App',
      description: 'Real-time browser notifications',
      status: 'active'
    },
    {
      icon: Smartphone,
      type: 'Push',
      description: 'Mobile web push notifications',
      status: 'available'
    },
    {
      icon: MessageCircle,
      type: 'Telegram',
      description: 'Mobile messaging integration',
      status: 'coming-soon'
    }
  ]

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Smart Assistant Demo
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Your AI-powered productivity companion that learns your patterns and helps you achieve more.
        </p>
        <div className="flex justify-center gap-4">
          <Button className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Try AI Chat
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Setup Reminders
          </Button>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <Card key={index} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Chat Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI Chat Examples
          </CardTitle>
          <CardDescription>
            See how the AI assistant understands and responds to your productivity questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleQueries.map((example, index) => {
              const IconComponent = example.icon
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">&ldquo;{example.query}&rdquo;</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 ml-8">
                    <p className="text-sm text-gray-700">{example.response}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how and when you want to receive your productivity insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {notificationTypes.map((channel, index) => {
              const IconComponent = channel.icon
              const statusColor = {
                'active': 'bg-green-100 text-green-800',
                'available': 'bg-blue-100 text-blue-800',
                'coming-soon': 'bg-yellow-100 text-yellow-800'
              }[channel.status]

              const statusText = {
                'active': 'Active',
                'available': 'Available',
                'coming-soon': 'Coming Soon'
              }[channel.status]

              return (
                <div key={index} className="border rounded-lg p-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{channel.type}</h3>
                    <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                  </div>
                  <Badge className={statusColor}>
                    {statusText}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Quick Setup
          </CardTitle>
          <CardDescription>
            Get started with your Smart Assistant in 3 simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Run Database Migration</h4>
                <p className="text-sm text-gray-600">Apply the Smart Assistant schema to your Supabase database</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  supabase db push
                </code>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Deploy Edge Functions</h4>
                <p className="text-sm text-gray-600">Set up automated reminders and scheduled tasks</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  ./setup-assistant.sh
                </code>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Configure Preferences</h4>
                <p className="text-sm text-gray-600">Customize your notification settings and AI preferences</p>
                <Button size="sm" className="mt-2">
                  Open Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
