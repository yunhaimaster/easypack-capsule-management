'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Bot, Send, Loader2, X, RotateCcw, ArrowUp, Copy, Download, MessageSquare, History, Trash2, Minimize2, Maximize2, RefreshCw } from 'lucide-react'
import { ProductionOrder } from '@/types'
import { useAIAssistant } from '@/hooks/use-ai-assistant'
import { AIDisclaimer, AIDisclaimerCompact } from '@/components/ui/ai-disclaimer'
import { AIThinkingIndicator, AIThinkingSteps } from '@/components/ui/ai-thinking-indicator'
// AISettings and AIRealReasoning removed - GPT-5 Mini doesn't support reasoning

interface SmartAIAssistantProps {
  orders: ProductionOrder[]
  currentOrder?: ProductionOrder | null
  pageData?: any
  showOnPages?: string[]
  includePathnames?: string[]
}

export function SmartAIAssistant({ orders, currentOrder, pageData, showOnPages = ['/orders'], includePathnames }: SmartAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // GPT-5 Mini doesn't support reasoning, so we don't need enableReasoning state
  const pathname = usePathname()

  const shouldShow = useMemo(() => {
    const targets = includePathnames && includePathnames.length > 0 ? includePathnames : showOnPages
    return targets.some(page => pathname.startsWith(page))
  }, [includePathnames, showOnPages, pathname])

  const {
    messages,
    input,
    setInput,
    isLoading,
    isThinking,
    isMinimized,
    showSettings,
    setShowSettings,
    chatHistory,
    messagesEndRef,
    messagesContainerRef,
    handleSendMessage,
    handleKeyPress,
    clearChat,
    startNewChat,
    loadChatHistory,
    deleteChatHistory,
    toggleMinimize,
    scrollToTop,
    copyMessage,
    exportConversation,
    retryLastMessage
  } = useAIAssistant({
    orders,
    currentOrder,
    context: pageData,
    enableReasoning: false, // GPT-5 Mini doesn't support reasoning
    initialAssistantMessage: {
      content: '您好！我是 Smart AI 助手，專為您分析訂單數據、客戶統計和生產效率。請選擇以下問題開始，或直接輸入您的問題：',
      suggestions: [
        '目前訂單的整體情況如何？',
        '最近最常下單的客戶是誰？',
        '哪些原料在訂單中最常出現？',
        '膠囊規格使用分布如何？',
        '近期常見的製程或品管問題有哪些？',
        '分析生產效率和品質指標'
      ]
    }
  })

  if (!shouldShow) {
    return null
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsFullscreen(false)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div>
      {/* 浮動 Smart AI 按鈕 */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button 
          variant="outline" 
          size="lg"
          className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 liquid-glass-card-interactive rounded-full h-14 w-14 sm:h-auto sm:w-auto sm:rounded-lg ${isOpen ? 'scale-95 opacity-70 pointer-events-none' : 'scale-100 opacity-100'}`}
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">Smart AI</span>
          <span className="sm:hidden">AI</span>
        </Button>
      </div>
      <LiquidGlassModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Smart AI 助手"
        className="ai-chat-modal"
        size="xl"
        animateFrom="button"
        fullscreen={isFullscreen}
        headerButtons={
          <div className="flex items-center space-x-2">
            {/* AISettings removed - GPT-5 Mini doesn't support reasoning */}
            <button
              className="liquid-glass-modal-close"
              onClick={toggleFullscreen}
              title={isFullscreen ? "退出全螢幕" : "全螢幕模式"}
              type="button"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button
              className="liquid-glass-modal-close"
              onClick={clearChat}
              title="重設對話"
              type="button"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        }
      >
        
        <div className="ai-modal-shell" style={{ height: isFullscreen ? 'calc(100vh - 8rem)' : '60vh' }}>

          <div className="ai-modal-stream" ref={messagesContainerRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`ai-message ${message.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`}
              >
                <div className="ai-message-content">
                    {/* AIRealReasoning removed - GPT-5 Mini doesn't support reasoning */}
                    <MarkdownRenderer content={message.content} whiteText={message.role === 'user'} />

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[rgba(18,42,64,0.65)]">建議問題</p>
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (suggestion === '重試') {
                              retryLastMessage()
                            } else {
                              setInput(suggestion)
                            }
                          }}
                          className="ai-suggestion-button"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.content && (
                    <div className="ai-message-actions">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="ai-message-action-btn"
                      >
                        <Copy className="w-3 h-3" />
                        <span>複製</span>
                      </button>
                      <button
                        onClick={() => {
                          const messageIndex = messages.findIndex(msg => msg.id === message.id)
                          if (messageIndex > 0) {
                            const userMessage = messages[messageIndex - 1]
                            if (userMessage && userMessage.role === 'user') {
                              setInput(userMessage.content)
                            } else {
                              setInput('請重新回答這個問題')
                            }
                          } else {
                            setInput('請重新回答這個問題')
                          }
                        }}
                        className="ai-message-action-btn"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>重新回答</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Simplified loading indicator - no reasoning support for GPT-5 Mini */}
            {isLoading && (
              <div className="ai-message ai-message-assistant">
                <AIThinkingIndicator isThinking={isLoading} enableReasoning={false} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-modal-input-row">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="輸入您的問題，或選擇建議問題快速開始"
              className="ai-modal-input"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="ai-modal-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </LiquidGlassModal>
    </div>
  )
}
