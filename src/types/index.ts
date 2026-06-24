export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type AIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'claude-3-5-sonnet' | 'claude-3-haiku'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  preferred_model: AIModel
  fcm_token?: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  due_date?: string
  due_time?: string
  priority: Priority
  status: TaskStatus
  category?: string
  reminder_at?: string
  created_at: string
  updated_at: string
}

export interface ShoppingItem {
  id: string
  user_id: string
  name: string
  quantity?: number
  unit?: string
  category?: string
  is_purchased: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Counter {
  id: string
  user_id: string
  name: string
  description?: string
  value: number
  target?: number
  unit?: string
  icon?: string
  color?: string
  reset_daily: boolean
  last_reset?: string
  created_at: string
  updated_at: string
}

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'hourly' | 'custom'

export interface Reminder {
  id: string
  user_id: string
  title: string
  description?: string
  remind_at: string
  frequency: ReminderFrequency
  frequency_config?: {
    days_of_week?: number[]
    interval_hours?: number
    interval_minutes?: number
  }
  is_active: boolean
  last_triggered?: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tool_calls?: ToolCall[]
  tool_results?: ToolResult[]
  model?: AIModel
  created_at: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  tool_call_id: string
  name: string
  result: unknown
  success: boolean
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  model: AIModel
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  tasks: {
    total: number
    pending: number
    completed: number
    overdue: number
    today: number
  }
  shopping: {
    total: number
    pending: number
    purchased: number
  }
  counters: {
    total: number
    active: number
  }
  reminders: {
    total: number
    upcoming: number
    today: number
  }
}

export interface AIToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, {
      type: string
      description?: string
      enum?: string[]
      items?: { type: string }
    }>
    required: string[]
  }
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  success: boolean
}
