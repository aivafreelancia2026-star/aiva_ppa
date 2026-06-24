import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardStats } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  const [tasks, shopping, counters, reminders, todayTasks] = await Promise.all([
    supabase.from('tasks').select('status').eq('user_id', user.id),
    supabase.from('shopping_items').select('is_purchased').eq('user_id', user.id),
    supabase.from('counters').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('reminders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true).gte('remind_at', now),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('due_date', today).neq('status', 'completed'),
  ])

  const taskData = (tasks.data ?? []) as { status: string }[]
  const shoppingData = (shopping.data ?? []) as { is_purchased: boolean }[]

  const stats: DashboardStats = {
    tasks: {
      total: taskData.length,
      pending: taskData.filter(t => t.status === 'pending').length,
      completed: taskData.filter(t => t.status === 'completed').length,
      overdue: 0,
      today: todayTasks.count ?? 0,
    },
    shopping: {
      total: shoppingData.length,
      pending: shoppingData.filter(s => !s.is_purchased).length,
      purchased: shoppingData.filter(s => s.is_purchased).length,
    },
    counters: {
      total: counters.count ?? 0,
      active: counters.count ?? 0,
    },
    reminders: {
      total: reminders.count ?? 0,
      upcoming: reminders.count ?? 0,
      today: 0,
    },
  }

  return NextResponse.json({ data: stats, success: true })
}
