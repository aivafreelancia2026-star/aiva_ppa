'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Filter, CheckCircle2, Circle, Clock,
  Trash2, Edit2, AlertCircle, ChevronDown, X, Calendar,
  Tag, Flag, Check, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate, PRIORITY_CONFIG, STATUS_CONFIG, isOverdue } from '@/lib/utils'
import type { Task, Priority, TaskStatus } from '@/types'
import toast from 'react-hot-toast'

type FilterStatus = TaskStatus | 'all'
type FilterPriority = Priority | 'all'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { loadTasks() }, [filterStatus, filterPriority])

  async function loadTasks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (filterStatus !== 'all') query = query.eq('status', filterStatus)
    if (filterPriority !== 'all') query = query.eq('priority', filterPriority)

    const { data } = await query
    setTasks(data ?? [])
    setLoading(false)
  }

  async function toggleComplete(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    if (error) { toast.error('Failed to update'); return }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    toast.success(newStatus === 'completed' ? '✅ Task completed!' : 'Task reopened')
  }

  async function deleteTask(id: string) {
    setDeletingId(id)
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); setDeletingId(null); return }
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Task deleted')
    setDeletingId(null)
  }

  const filtered = tasks.filter(t =>
    !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped = {
    pending: filtered.filter(t => t.status === 'pending'),
    in_progress: filtered.filter(t => t.status === 'in_progress'),
    completed: filtered.filter(t => t.status === 'completed'),
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Tasks</h1>
          <p className="text-theme-secondary text-sm mt-0.5">{tasks.filter(t => t.status !== 'completed').length} active tasks</p>
        </div>
        <button onClick={() => { setEditTask(null); setShowModal(true) }} className="btn-primary text-sm py-2.5 self-start">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="input-field pl-10 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="input-field text-sm w-36"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as FilterPriority)}
            className="input-field text-sm w-36"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-slate-400 font-medium">No tasks found</h3>
          <p className="text-slate-600 text-sm mt-1">Create your first task to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2 px-4 mt-4">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([status, statusTasks]) => {
            if (statusTasks.length === 0 && filterStatus !== 'all') return null
            if (statusTasks.length === 0) return null
            const sc = STATUS_CONFIG[status as TaskStatus]
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`status-badge ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  <span className="text-xs text-slate-600">{statusTasks.length}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {statusTasks.map(task => {
                      const pc = PRIORITY_CONFIG[task.priority]
                      const overdue = task.due_date && task.status !== 'completed' && isOverdue(task.due_date, task.due_time)
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={cn(
                            'glass-card p-4 flex items-start gap-3 group',
                            task.status === 'completed' && 'opacity-60'
                          )}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleComplete(task)}
                            className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                          >
                            {task.status === 'completed'
                              ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                              : <Circle className="w-5 h-5 text-theme-secondary hover:text-accent-purple" />
                            }
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-2">
                              <span className={cn('text-sm font-medium text-theme-primary flex-1', task.status === 'completed' && 'line-through text-theme-muted')}>
                                {task.title}
                              </span>
                              <span className={`status-badge ${pc.bg} ${pc.color} text-[10px]`}>{pc.label}</span>
                            </div>

                            {task.description && (
                              <p className="text-xs text-theme-secondary mt-1 line-clamp-1">{task.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {task.due_date && (
                                <div className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-400' : 'text-theme-secondary')}>
                                  {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                  {formatDate(task.due_date)}
                                  {task.due_time && ` · ${task.due_time}`}
                                </div>
                              )}
                              {task.category && (
                                <div className="flex items-center gap-1 text-xs text-theme-secondary">
                                  <Tag className="w-3 h-3" />
                                  {task.category}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditTask(task); setShowModal(true) }}
                              className="p-1.5 rounded-lg hover:bg-theme-elevated text-theme-secondary hover:text-theme-primary transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              disabled={deletingId === task.id}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-theme-secondary hover:text-red-400 transition-all"
                            >
                              {deletingId === task.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Task Modal */}
      <AnimatePresence>
        {showModal && (
          <TaskModal
            task={editTask}
            onClose={() => { setShowModal(false); setEditTask(null) }}
            onSave={async (data) => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return

              if (editTask) {
                const { error } = await supabase.from('tasks').update(data).eq('id', editTask.id)
                if (error) { toast.error('Failed to update'); return }
                toast.success('Task updated!')
              } else {
                const { error } = await supabase.from('tasks').insert({ ...data, user_id: user.id })
                if (error) { toast.error('Failed to create'); return }
                toast.success('Task created!')
              }
              setShowModal(false)
              setEditTask(null)
              loadTasks()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function TaskModal({ task, onClose, onSave }: {
  task: Task | null
  onClose: () => void
  onSave: (data: Partial<Task>) => Promise<void>
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [dueTime, setDueTime] = useState(task?.due_time ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'pending')
  const [category, setCategory] = useState(task?.category ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onSave({ title: title.trim(), description: description || undefined, due_date: dueDate || undefined, due_time: dueTime || undefined, priority, status, category: category || undefined })
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-strong rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-theme-primary">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-elevated text-theme-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" required className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details..." rows={2} className="input-field text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Due Time</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="input-field text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="input-field text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className="input-field text-sm">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="work, personal, health..." className="input-field text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
            <button type="submit" disabled={saving || !title.trim()} className="btn-primary flex-1 py-2.5 text-sm justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
