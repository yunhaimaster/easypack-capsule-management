'use client'

import React, { useOptimistic, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconContainer } from '@/components/ui/icon-container'
import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimisticMessage {
  id: string
  text: string
  timestamp: Date
  status: 'pending' | 'sent' | 'error'
}

interface OptimisticFormProps {
  onSubmit: (formData: FormData) => Promise<void>
  placeholder?: string
  className?: string
}

export function OptimisticForm({ 
  onSubmit, 
  placeholder = "Type your message...",
  className 
}: OptimisticFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    [] as OptimisticMessage[],
    (state, newMessage: OptimisticMessage) => [
      newMessage,
      ...state
    ]
  )

  async function handleSubmit(formData: FormData) {
    const message = formData.get('message') as string
    
    if (!message.trim()) return

    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      id: `temp-${Date.now()}`,
      text: message,
      timestamp: new Date(),
      status: 'pending'
    }

    // Add optimistic message immediately
    addOptimisticMessage(optimisticMessage)
    
    // Reset form
    formRef.current?.reset()

    // Submit to server
    startTransition(async () => {
      try {
        await onSubmit(formData)
        // The optimistic message will be replaced by the server response
      } catch (error) {
        // In a real app, you'd want to update the optimistic message to show error state
        console.error('Failed to submit message:', error)
      }
    })
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Messages List */}
      {optimisticMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optimisticMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  message.status === 'pending' && "bg-blue-50 border-blue-200",
                  message.status === 'sent' && "bg-green-50 border-green-200",
                  message.status === 'error' && "bg-red-50 border-red-200"
                )}
              >
                <IconContainer
                  icon={
                    message.status === 'pending' ? Loader2 :
                    message.status === 'sent' ? CheckCircle :
                    AlertCircle
                  }
                  variant={
                    message.status === 'pending' ? 'info' :
                    message.status === 'sent' ? 'success' :
                    'danger'
                  }
                  size="sm"
                  className={cn(
                    message.status === 'pending' && "animate-spin"
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm text-neutral-800">{message.text}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                    {message.status === 'pending' && " • Sending..."}
                    {message.status === 'sent' && " • Sent"}
                    {message.status === 'error' && " • Failed to send"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            name="message"
            placeholder={placeholder}
            disabled={isPending}
            className="flex-1"
            required
          />
          <Button 
            type="submit" 
            disabled={isPending}
            className="min-w-[100px]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Example usage component
interface MessageThreadProps {
  initialMessages: OptimisticMessage[]
  sendMessageAction: (formData: FormData) => Promise<void>
}

export function MessageThread({ 
  initialMessages, 
  sendMessageAction 
}: MessageThreadProps) {
  const [messages, setMessages] = React.useState(initialMessages)
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: OptimisticMessage) => [
      newMessage,
      ...state
    ]
  )

  async function handleSubmit(formData: FormData) {
    const message = formData.get('message') as string
    
    if (!message.trim()) return

    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      id: `temp-${Date.now()}`,
      text: message,
      timestamp: new Date(),
      status: 'pending'
    }

    // Add optimistic message immediately
    addOptimisticMessage(optimisticMessage)

    try {
      await sendMessageAction(formData)
      // Update the actual messages state
      setMessages(prev => [optimisticMessage, ...prev])
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    }
  }

  return (
    <div className="space-y-4">
      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Message Thread</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {optimisticMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                message.status === 'pending' && "bg-blue-50 border-blue-200",
                message.status === 'sent' && "bg-green-50 border-green-200",
                message.status === 'error' && "bg-red-50 border-red-200"
              )}
            >
              <IconContainer
                icon={
                  message.status === 'pending' ? Loader2 :
                  message.status === 'sent' ? CheckCircle :
                  AlertCircle
                }
                variant={
                  message.status === 'pending' ? 'info' :
                  message.status === 'sent' ? 'success' :
                  'danger'
                }
                size="sm"
                className={cn(
                  message.status === 'pending' && "animate-spin"
                )}
              />
              <div className="flex-1">
                <p className="text-sm text-neutral-800">{message.text}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                  {message.status === 'pending' && " • Sending..."}
                  {message.status === 'sent' && " • Sent"}
                  {message.status === 'error' && " • Failed to send"}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Form */}
      <OptimisticForm onSubmit={handleSubmit} />
    </div>
  )
}
