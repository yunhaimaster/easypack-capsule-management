'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog-custom'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Bot, Send, Loader2, X, RotateCcw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  orders: any[]
}

export function AIAssistant({ orders }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          orders: orders
        }),
      })

      if (!response.ok) {
        throw new Error('AI 助手暫時無法回應')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，AI 助手暫時無法回應。請稍後再試或聯繫 Victor。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          <Bot className="h-4 w-4 mr-2" />
          AI 助手
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="h-5 w-5 mr-2 text-blue-600" />
              AI 訂單助手
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="h-8 w-8 p-0"
                title="清除對話"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
                title="關閉"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50 text-blue-600" />
              <p className="text-lg font-medium mb-2">歡迎使用 AI 訂單助手！</p>
              <p className="text-sm mb-4">您可以詢問關於訂單的任何問題，例如：</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <button
                  onClick={() => setInput('顯示所有未完工的訂單')}
                  className="bg-blue-50 hover:bg-blue-100 p-3 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-medium text-blue-800 mb-1">查詢訂單</p>
                  <p className="text-blue-600">&ldquo;顯示所有未完工的訂單&rdquo;</p>
                </button>
                <button
                  onClick={() => setInput('哪個客戶的訂單最多？')}
                  className="bg-green-50 hover:bg-green-100 p-3 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-medium text-green-800 mb-1">統計分析</p>
                  <p className="text-green-600">&ldquo;哪個客戶的訂單最多？&rdquo;</p>
                </button>
                <button
                  onClick={() => setInput('維生素C相關的訂單有哪些？')}
                  className="bg-purple-50 hover:bg-purple-100 p-3 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-medium text-purple-800 mb-1">原料查詢</p>
                  <p className="text-purple-600">&ldquo;維生素C相關的訂單有哪些？&rdquo;</p>
                </button>
                <button
                  onClick={() => setInput('最近一週的生產情況如何？')}
                  className="bg-orange-50 hover:bg-orange-100 p-3 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-medium text-orange-800 mb-1">時間分析</p>
                  <p className="text-orange-600">&ldquo;最近一週的生產情況如何？&rdquo;</p>
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <MarkdownRenderer content={message.content} />
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">AI 正在思考...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="詢問關於訂單的任何問題..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
