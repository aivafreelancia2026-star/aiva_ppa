'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckSquare, ShoppingCart, BarChart3, Bell, MessageSquare,
  TrendingUp, Clock, AlertCircle, Sparkles, ArrowRight,
  CheckCircle2, Plus, Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, PRIORITY_CONFIG } from '@/lib/utils'
import type { Task, DashboardStats } from '@/types'

const STAT_CARDS = [
  {
    label: 'Pending Tasks',
    key: 'tasks.pending' as const,
    icon: CheckSquare,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    href: '/dashboard/tasks',
  },
  {
    label: 'Shopping Items',
    key: 'shopping.pending' as const,
    icon: ShoppingCart,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    href: '/dashboard/shopping',
  },
  {
    label: 'Active Counters',
    key: 'counters.active' as const,
    icon: BarChart3,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    href: '/dashboard/counters',
  },
  {
    label: 'Upcoming Reminders',
    key: 'reminders.upcoming' as const,
    icon: Bell,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    href: '/dashboard/reminders',
  },
]

function getStatValue(stats: DashboardStats | null, key: string): number {
  if (!stats) return 0
  const parts = key.split('.')
  let val: unknown = stats
  for (const p of parts) {
    val = (val as Record<string, unknown>)?.[p]
  }
  return (val as number) ?? 0
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Good day')
  const [formattedDate, setFormattedDate] = useState('')
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    setFormattedDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    const [tasksRes, shoppingRes, countersRes, remindersRes, todayTasksRes] = await Promise.all([
      supabase.from('tasks').select('status', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('shopping_items').select('is_purchased', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('counters').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('reminders').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true).gte('remind_at', now),
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('due_date', today).neq('status', 'completed').order('priority').limit(5),
    ])

    const tasks = (tasksRes.data ?? []) as { status: string }[]
    const shopping = (shoppingRes.data ?? []) as { is_purchased: boolean }[]

    setStats({
      tasks: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: 0,
        today: todayTasksRes.data?.length ?? 0,
      },
      shopping: {
        total: shopping.length,
        pending: shopping.filter(s => !s.is_purchased).length,
        purchased: shopping.filter(s => s.is_purchased).length,
      },
      counters: {
        total: countersRes.count ?? 0,
        active: countersRes.count ?? 0,
      },
      reminders: {
        total: remindersRes.count ?? 0,
        upcoming: remindersRes.count ?? 0,
        today: 0,
      },
    })

    setTodayTasks(todayTasksRes.data ?? [])
    setLoading(false)
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-theme-primary">
            {greeting}! 👋
          </h1>
          <p className="text-theme-secondary mt-1 text-sm">
            {mounted ? formattedDate : ''}
            {todayTasks.length > 0 && ` · ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today`}
          </p>
        </div>
        <Link href="/dashboard/chat" className="btn-primary text-sm py-2.5 self-start">
          <Sparkles className="w-4 h-4" />
          Ask AIVA
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <Link key={card.label} href={card.href}>
            <div className="glass-card p-5 cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                   style={{ background: card.bg }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-theme-muted group-hover:text-theme-secondary transition-colors" />
              </div>
              <div className="text-2xl font-bold text-theme-primary">
                {loading ? (
                  <div className="w-8 h-7 shimmer rounded" />
                ) : (
                  getStatValue(stats, card.key)
                )}
              </div>
              <div className="text-xs text-theme-secondary mt-1">{card.label}</div>
            </div>
          </Link>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-accent-purple" />
                <h2 className="font-semibold text-theme-primary">Today&apos;s Tasks</h2>
              </div>
              <Link href="/dashboard/tasks" className="text-xs text-accent-purple hover:text-accent-violet flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 shimmer rounded-xl" />)}
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-theme-secondary mx-auto mb-3" />
                <p className="text-theme-secondary text-sm">No tasks due today</p>
                <Link href="/dashboard/tasks" className="btn-secondary text-xs py-1.5 px-3 mt-3 inline-flex">
                  <Plus className="w-3 h-3" /> Add a task
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map(task => {
                  const pc = PRIORITY_CONFIG[task.priority]
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-elevated transition-colors group">
                      <div className="w-4 h-4 rounded-full border-2 border-accent-purple/50 flex-shrink-0 group-hover:border-accent-purple" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-theme-primary truncate">{task.title}</div>
                        {task.due_time && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-theme-muted" />
                            <span className="text-xs text-theme-muted">{task.due_time}</span>
                          </div>
                        )}
                      </div>
                      <span className={`status-badge ${pc.bg} ${pc.color} ${pc.border} border text-[10px]`}>
                        {pc.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h2 className="font-semibold text-theme-primary">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'New Task', href: '/dashboard/tasks', icon: CheckSquare, color: '#8b5cf6' },
                { label: 'Add to Shopping', href: '/dashboard/shopping', icon: ShoppingCart, color: '#06b6d4' },
                { label: 'Set Reminder', href: '/dashboard/reminders', icon: Bell, color: '#f59e0b' },
                { label: 'Track Counter', href: '/dashboard/counters', icon: BarChart3, color: '#10b981' },
                { label: 'Chat with AIVA', href: '/dashboard/chat', icon: MessageSquare, color: '#ec4899' },
              ].map(action => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-elevated transition-all group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${action.color}15` }}>
                      <action.icon className="w-4 h-4" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm text-theme-secondary group-hover:text-theme-primary transition-colors">{action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-theme-muted group-hover:text-theme-secondary ml-auto transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* AIVA Prompt Banner */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl p-6 bg-theme-panel border border-theme-border">
          <div className="orb w-[200px] h-[200px] bg-violet-600/20 top-[-80px] right-[-50px]" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-accent-purple">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-theme-primary">Talk to AIVA</h3>
              <p className="text-theme-secondary text-sm mt-0.5">
                &ldquo;Add milk to shopping list and remind me tomorrow at 6 PM to buy it.&rdquo;
              </p>
            </div>
            <Link href="/dashboard/chat" className="btn-primary text-sm py-2 flex-shrink-0">
              Open Chat <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
