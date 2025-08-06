import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Lightbulb,
  Calendar,
  Target,
  CheckSquare,
  BarChart3
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface Conversation {
  id: string
  title?: string
  messages: Message[]
  created_at: string
  updated_at: string
}

interface AssistantChatProps {
  conversation?: Conversation
  onSendMessage: (message: string) => Promise<string>
  onClose: () => void
  isLoading?: boolean
}

const suggestedQuestions = [
  {
    icon: Calendar,
    text: "What&apos;s my focus for today?",
    category: "daily"
  },
  {
    icon: Target,
    text: "How are my goals progressing?",
    category: "goals"
  },
  {
    icon: CheckSquare,
    text: "What tasks are overdue?",
    category: "tasks"
  },
  {
    icon: BarChart3,
    text: "Summarize my week",
    category: "analytics"
  },
  {
    icon: Lightbulb,
    text: "What should I prioritize?",
    category: "advice"
  }
]

export default function AssistantChat({ 
  conversation, 
  onSendMessage, 
  onClose, 
  isLoading = false 
}: AssistantChatProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isSending) return

    setInputMessage('')
    setIsSending(true)

    try {
      await onSendMessage(message.trim())
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputMessage)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-500">
              {conversation?.title || 'Ask me anything about your productivity'}
            </p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          ×
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!conversation?.messages?.length ? (
          /* Welcome Screen */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hello! I&apos;m your AI Assistant
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              I can help you understand your productivity patterns, suggest improvements, 
              and answer questions about your tasks, goals, and schedule.
            </p>
            
            {/* Suggested Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {suggestedQuestions.map((question, index) => {
                const IconComponent = question.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question.text)}
                    className="flex items-center gap-3 p-3 text-left bg-white rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    disabled={isSending}
                  >
                    <IconComponent className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                    <span className="text-sm text-gray-700 group-hover:text-blue-800">
                      {question.text}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <>
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="bg-white border shadow-sm p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t rounded-b-lg">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your productivity..."
              disabled={isSending || isLoading}
              className="pr-10"
            />
          </div>
          <Button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isSending || isLoading}
            size="sm"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        {(!conversation?.messages?.length || conversation.messages.length === 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <Button
                key={index}
                onClick={() => handleSuggestedQuestion(question.text)}
                variant="outline"
                size="sm"
                disabled={isSending}
                className="text-xs"
              >
                {question.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
