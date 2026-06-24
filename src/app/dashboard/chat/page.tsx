'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Send, Loader2, Plus, ChevronDown, Sparkles,
  CheckSquare, ShoppingCart, BarChart3, Bell, Trash2, Copy, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, MODEL_CONFIG } from '@/lib/utils'
import type { ChatMessage, AIModel } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  { icon: CheckSquare, text: 'Add task "Review proposal" due tomorrow, high priority', color: '#f59e0b' },
  { icon: ShoppingCart, text: 'Add milk, eggs, and 2kg rice to my shopping list', color: '#06b6d4' },
  { icon: BarChart3, text: 'Increase my water counter by 2', color: '#10b981' },
  { icon: Bell, text: 'Remind me to call mom at 8 PM today', color: '#f59e0b' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState<AIModel>('gpt-4o-mini')
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function copyMessage(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const sendMessage = useCallback(async (text?: string) => {
    const content = text ?? input.trim()
    if (!content || loading) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); return }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (inputRef.current) { inputRef.current.style.height = 'auto' }
    setLoading(true)

    const assistantId = crypto.randomUUID()
    const placeholderMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      model,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, placeholderMsg])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          model,
          userId: user.id,
          conversationId,
        }),
      })

      if (!response.ok) throw new Error('Request failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullContent += parsed.content
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  ))
                }
                if (parsed.conversationId) setConversationId(parsed.conversationId)
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
          : m
      ))
      toast.error('Failed to get response')
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, model, conversationId, supabase])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([])
    setConversationId(null)
    toast.success('Chat cleared')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto -mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-theme-primary">AIVA AI</h2>
            <p className="text-xs text-theme-secondary">Your agentic productivity assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg text-theme-secondary hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setModelMenuOpen(!modelMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-accent-purple/10 border border-theme-border text-accent-purple hover:bg-accent-purple/20"
            >
              <span>{MODEL_CONFIG[model].icon}</span>
              <span className="hidden sm:block">{MODEL_CONFIG[model].label}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', modelMenuOpen && 'rotate-180')} />
            </button>

             <AnimatePresence>
              {modelMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50 bg-theme-panel border border-theme-border shadow-lg"
                >
                  {(Object.entries(MODEL_CONFIG) as [AIModel, typeof MODEL_CONFIG[AIModel]][]).map(([id, cfg]) => (
                    <button
                      key={id}
                      onClick={() => { setModel(id); setModelMenuOpen(false) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-theme-elevated',
                        model === id && 'bg-accent-purple/10'
                      )}
                    >
                      <span className="text-lg">{cfg.icon}</span>
                      <div>
                        <div className="text-theme-primary font-medium text-xs">{cfg.label}</div>
                        <div className="text-theme-secondary text-[10px]">{cfg.provider}</div>
                      </div>
                      {model === id && <Check className="w-3.5 h-3.5 text-accent-purple ml-auto" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-8 text-center"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)', boxShadow: '0 0 40px rgba(245,158,11,0.4)' }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-theme-primary mb-2">How can I help you today?</h3>
              <p className="text-theme-secondary text-sm max-w-xs mx-auto">
                I can manage your tasks, shopping list, counters, and reminders through natural conversation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.text}
                  onClick={() => sendMessage(s.text)}
                  className="flex items-start gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.02] bg-theme-elevated border border-theme-border hover:bg-theme-elevated/80"
                >
                  <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                  <span className="text-xs text-theme-secondary leading-relaxed">{s.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)' }}>
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={cn('group max-w-[85%] relative', msg.role === 'user' ? 'items-end' : 'items-start')}>
                  {msg.role === 'assistant' && msg.model && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] text-theme-muted">{MODEL_CONFIG[msg.model]?.label}</span>
                    </div>
                  )}

                  <div className={cn('px-4 py-3 text-sm leading-relaxed', msg.role === 'user' ? 'chat-user text-white' : 'chat-ai text-theme-primary')}>
                    {msg.role === 'user' ? (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    ) : msg.content ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                          code: ({ children }) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono text-amber-300">{children}</code>,
                          strong: ({ children }) => <strong className="text-theme-primary font-semibold">{children}</strong>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex items-center gap-2 text-theme-secondary">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-xs">Thinking...</span>
                      </div>
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.content && (
                    <button
                      onClick={() => copyMessage(msg.content, msg.id)}
                      className="absolute -bottom-6 right-0 opacity-60 group-hover:opacity-100 hover:text-theme-primary transition-opacity flex items-center gap-1 text-[10px] text-theme-secondary"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold bg-accent-purple/20 text-accent-purple">
                    U
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} className="pb-2" />
      </div>

      {/* Input */}
      <div className="mt-4 flex-shrink-0">
        <div className="relative rounded-2xl overflow-hidden bg-theme-panel border border-theme-border shadow-lg">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(e.target) }}
            onKeyDown={handleKeyDown}
            placeholder="Ask AIVA anything... 'Add task', 'Remind me', 'Show shopping list'"
            rows={1}
            className="w-full px-5 py-4 pr-14 bg-transparent text-sm text-theme-primary placeholder-theme-secondary/60 outline-none resize-none"
            style={{ maxHeight: '160px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={cn(
              'absolute right-3 bottom-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
              input.trim() && !loading
                ? 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg shadow-amber-500/30 hover:scale-110'
                : 'bg-theme-elevated text-theme-muted/50 cursor-not-allowed'
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-theme-muted mt-2">
          AIVA can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
