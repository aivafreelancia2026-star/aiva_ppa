import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d, yyyy')
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const abs = Math.abs(diff)

  if (abs < 60000) return 'just now'
  if (abs < 3600000) return `${Math.round(abs / 60000)}m ${diff < 0 ? 'ago' : ''}`
  if (abs < 86400000) return `${Math.round(abs / 3600000)}h ${diff < 0 ? 'ago' : ''}`
  return formatDate(d)
}

export function isOverdue(dueDate: string, dueTime?: string): boolean {
  const dateStr = dueTime ? `${dueDate}T${dueTime}` : dueDate
  return isPast(parseISO(dateStr))
}

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  urgent: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
} as const

export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-400/10' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-400/10' },
} as const

export const MODEL_CONFIG = {
  'gpt-4o': { label: 'GPT-4o', provider: 'OpenAI', color: '#10a37f', icon: '🤖' },
  'gpt-4o-mini': { label: 'GPT-4o Mini', provider: 'OpenAI', color: '#10a37f', icon: '🤖' },
  'gemini-1.5-pro': { label: 'Gemini 1.5 Pro', provider: 'Google', color: '#4285f4', icon: '💎' },
  'gemini-1.5-flash': { label: 'Gemini 1.5 Flash', provider: 'Google', color: '#4285f4', icon: '⚡' },
  'claude-3-5-sonnet': { label: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: '#cc785c', icon: '🎭' },
  'claude-3-haiku': { label: 'Claude 3 Haiku', provider: 'Anthropic', color: '#cc785c', icon: '🌸' },
} as const
