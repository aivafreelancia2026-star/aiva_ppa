'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  CheckSquare, Bell, Plus, Tag, Flag, Clock, Check, X, Loader2
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Task, Reminder, Priority } from '@/types'
import toast from 'react-hot-toast'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO
} from 'date-fns'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [showTasks, setShowTasks] = useState(true)
  const [showReminders, setShowReminders] = useState(true)

  // Quick Task Creation State
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('medium')
  const [isSavingTask, setIsSavingTask] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all tasks
      const { data: fetchedTasks, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)

      if (taskErr) throw taskErr

      // Fetch all reminders
      const { data: fetchedReminders, error: remErr } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)

      if (remErr) throw remErr

      setTasks(fetchedTasks || [])
      setReminders(fetchedReminders || [])
    } catch (err: any) {
      toast.error('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get start/end of current month and generate days interval for the grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // Helpers to get items for specific day
  const getTasksForDay = (date: Date) => {
    if (!showTasks) return []
    return tasks.filter(task => {
      if (!task.due_date) return false
      // Parse YYYY-MM-DD
      const [year, month, day] = task.due_date.split('-').map(Number)
      const taskDate = new Date(year, month - 1, day)
      return isSameDay(taskDate, date)
    })
  }

  const getRemindersForDay = (date: Date) => {
    if (!showReminders) return []
    return reminders.filter(reminder => {
      if (!reminder.remind_at) return false
      return isSameDay(parseISO(reminder.remind_at), date)
    })
  }

  async function toggleTaskComplete(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id)

      if (error) throw error

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
      toast.success(newStatus === 'completed' ? '✅ Task completed!' : 'Task reopened')
    } catch (err: any) {
      toast.error('Failed to update task: ' + err.message)
    }
  }

  async function handleQuickTaskSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return

    setIsSavingTask(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const localDate = format(selectedDate, 'yyyy-MM-dd')

      const newTask = {
        title: quickTaskTitle.trim(),
        due_date: localDate,
        priority: quickTaskPriority,
        status: 'pending',
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single()

      if (error) throw error

      setTasks(prev => [data, ...prev])
      setQuickTaskTitle('')
      toast.success('Task added successfully')
    } catch (err: any) {
      toast.error('Failed to add task: ' + err.message)
    } finally {
      setIsSavingTask(false)
    }
  }

  const selectedDayTasks = getTasksForDay(selectedDate)
  const selectedDayReminders = getRemindersForDay(selectedDate)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-teal-400" /> Calendar
          </h1>
          <p className="text-theme-secondary text-sm mt-0.5">Visualize and organize your timeline</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-theme-elevated border border-theme-border px-3.5 py-1.5 rounded-xl text-xs font-medium text-theme-secondary cursor-pointer hover:bg-theme-elevated/80 transition-colors">
            <input
              type="checkbox"
              checked={showTasks}
              onChange={e => setShowTasks(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-teal-600 focus:ring-teal-500"
            />
            <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
            Tasks
          </label>
          <label className="flex items-center gap-2 bg-theme-elevated border border-theme-border px-3.5 py-1.5 rounded-xl text-xs font-medium text-theme-secondary cursor-pointer hover:bg-theme-elevated/80 transition-colors">
            <input
              type="checkbox"
              checked={showReminders}
              onChange={e => setShowReminders(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-yellow-600 focus:ring-yellow-500"
            />
            <Bell className="w-3.5 h-3.5 text-yellow-400" />
            Reminders
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          <span>Loading calendar...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid Section */}
          <div className="lg:col-span-2 glass-card p-4 sm:p-6 flex flex-col space-y-4">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme-primary">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg bg-theme-elevated hover:bg-theme-elevated/80 border border-theme-border text-theme-secondary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1.5 rounded-lg bg-theme-elevated hover:bg-theme-elevated/80 border border-theme-border text-xs font-medium text-theme-secondary transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg bg-theme-elevated hover:bg-theme-elevated/80 border border-theme-border text-theme-secondary transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of the Week */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-theme-secondary pb-2 border-b border-theme-border">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1 flex-1">
              {days.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                const dayTasks = getTasksForDay(day)
                const dayReminders = getRemindersForDay(day)
                const hasEvents = dayTasks.length > 0 || dayReminders.length > 0
                const isTodayDate = isSameDay(day, new Date())

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                     className={cn(
                      "min-h-[70px] sm:min-h-[90px] p-2 flex flex-col items-start justify-between rounded-xl transition-all duration-200 border text-left relative overflow-hidden group",
                      isSelected
                        ? "bg-teal-900/30 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                        : isCurrentMonth
                          ? "bg-theme-panel border-theme-border hover:bg-theme-elevated text-theme-primary"
                          : "bg-transparent border-transparent text-theme-muted hover:bg-theme-elevated/40"
                    )}
                  >
                    {/* Day Number */}
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-md",
                      isTodayDate
                        ? "bg-teal-500 text-white"
                        : isSelected
                          ? "text-teal-400"
                          : "text-theme-secondary"
                    )}>
                      {format(day, 'd')}
                    </span>

                    {/* Events indicators: compact on small screens, detailed on large */}
                    <div className="w-full mt-2 space-y-1">
                      {/* Desktop List */}
                      <div className="hidden sm:block space-y-1">
                        {dayTasks.slice(0, 2).map(task => (
                          <div
                            key={task.id}
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-medium truncate flex items-center gap-1",
                              task.status === 'completed'
                                ? "bg-emerald-500/10 text-emerald-400 line-through"
                                : "bg-teal-500/10 text-teal-300"
                            )}
                          >
                            <CheckSquare className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {dayReminders.slice(0, 1).map(rem => (
                          <div
                            key={rem.id}
                            className="text-[10px] bg-yellow-500/10 text-yellow-300 px-1.5 py-0.5 rounded font-medium truncate flex items-center gap-1"
                          >
                            <Bell className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{rem.title}</span>
                          </div>
                        ))}
                        {/* More count */}
                        {(dayTasks.length + dayReminders.length) > 3 && (
                          <div className="text-[9px] text-slate-500 font-medium pl-1.5">
                            +{(dayTasks.length + dayReminders.length) - 3} more
                          </div>
                        )}
                      </div>

                      {/* Mobile Dots */}
                      <div className="flex sm:hidden items-center justify-center gap-1 w-full pt-1">
                        {dayTasks.length > 0 && (
                          <div className={cn("w-1.5 h-1.5 rounded-full", dayTasks.every(t => t.status === 'completed') ? "bg-emerald-500" : "bg-teal-500")} />
                        )}
                        {dayReminders.length > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Details Sidebar / Panel */}
          <div className="glass-card p-6 flex flex-col space-y-5">
            <div>
              <h3 className="text-base font-semibold text-theme-primary">
                {format(selectedDate, 'EEEE')}
              </h3>
              <p className="text-xs text-theme-secondary mt-0.5">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>

            {/* Quick Add Task */}
            <form onSubmit={handleQuickTaskSubmit} className="space-y-3 pt-3 border-t border-theme-border">
              <span className="text-xs font-semibold text-theme-secondary">Quick Add Task</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={quickTaskTitle}
                  onChange={e => setQuickTaskTitle(e.target.value)}
                  className="input-field text-xs py-2 flex-1"
                />
                <select
                  value={quickTaskPriority}
                  onChange={e => setQuickTaskPriority(e.target.value as Priority)}
                  className="input-field text-xs py-2 w-24"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button
                  type="submit"
                  disabled={isSavingTask || !quickTaskTitle.trim()}
                  className="btn-primary p-2 flex-shrink-0"
                >
                  {isSavingTask ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>

            {/* Event Lists */}
            <div className="flex-1 space-y-4 overflow-y-auto">
              {/* Tasks List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-theme-secondary block">
                  Tasks ({selectedDayTasks.length})
                </span>
                {selectedDayTasks.length === 0 ? (
                  <p className="text-xs text-theme-secondary italic">No tasks due today</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => toggleTaskComplete(task)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer group transition-all duration-200",
                          task.status === 'completed'
                            ? "bg-emerald-500/5 border-emerald-500/10 text-theme-muted"
                            : "bg-theme-panel border-theme-border text-theme-primary hover:bg-theme-elevated"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors",
                          task.status === 'completed'
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-500 group-hover:border-teal-400"
                        )}>
                          {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn("text-xs font-medium flex-1 truncate", task.status === 'completed' && "line-through")}>
                          {task.title}
                        </span>
                        <span className={cn(
                          "text-[9px] font-semibold px-2 py-0.5 rounded capitalize",
                          task.priority === 'urgent' && "bg-rose-500/10 text-rose-400",
                          task.priority === 'high' && "bg-amber-500/10 text-amber-400",
                          task.priority === 'medium' && "bg-teal-500/10 text-teal-400",
                          task.priority === 'low' && "bg-theme-elevated text-theme-secondary"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminders List */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-theme-secondary block">
                  Reminders ({selectedDayReminders.length})
                </span>
                {selectedDayReminders.length === 0 ? (
                  <p className="text-xs text-theme-secondary italic">No reminders today</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayReminders.map(rem => (
                      <div
                        key={rem.id}
                        className="flex items-center gap-3 p-3 rounded-xl border bg-theme-panel border-theme-border text-theme-primary"
                      >
                        <Bell className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium block truncate">
                            {rem.title}
                          </span>
                          {rem.description && (
                            <span className="text-[10px] text-theme-secondary block truncate">
                              {rem.description}
                            </span>
                          )}
                        </div>
                        {rem.remind_at && (
                          <div className="flex items-center gap-1 text-[9px] text-theme-secondary">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(rem.remind_at), 'p')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
