'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Bell, BellOff, Trash2, Edit2, X,
  Clock, Calendar, Repeat, Loader2, CheckCircle2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatRelative } from '@/lib/utils'
import type { Reminder, ReminderFrequency } from '@/types'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const FREQ_LABELS: Record<ReminderFrequency, string> = {
  once: 'One-time', daily: 'Daily', weekly: 'Weekly',
  monthly: 'Monthly', hourly: 'Hourly', custom: 'Custom',
}

const FREQ_COLORS: Record<ReminderFrequency, string> = {
  once: '#f59e0b', daily: '#d97706', weekly: '#10b981',
  monthly: '#f59e0b', hourly: '#ec4899', custom: '#f87171',
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editReminder, setEditReminder] = useState<Reminder | null>(null)
  const supabase = createClient()

  useEffect(() => { loadReminders() }, [])

  async function loadReminders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('reminders').select('*').eq('user_id', user.id).order('remind_at')
    setReminders(data ?? [])
    setLoading(false)
  }

  async function toggleActive(reminder: Reminder) {
    const { error } = await supabase.from('reminders').update({ is_active: !reminder.is_active }).eq('id', reminder.id)
    if (error) { toast.error('Failed'); return }
    setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, is_active: !r.is_active } : r))
    toast.success(reminder.is_active ? 'Reminder paused' : '🔔 Reminder activated')
  }

  async function deleteReminder(id: string) {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
    toast.success('Reminder deleted')
  }

  const now = new Date()
  const upcoming = reminders.filter(r => r.is_active && new Date(r.remind_at) > now)
  const past = reminders.filter(r => !r.is_active || new Date(r.remind_at) <= now)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Reminders</h1>
          <p className="text-theme-secondary text-sm mt-0.5">{upcoming.length} upcoming</p>
        </div>
        <button onClick={() => { setEditReminder(null); setShowModal(true) }} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {/* Upcoming */}
      {!loading && upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-theme-secondary">Upcoming</span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {upcoming.map(reminder => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggle={toggleActive}
                  onEdit={() => { setEditReminder(reminder); setShowModal(true) }}
                  onDelete={deleteReminder}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Past / inactive */}
      {!loading && past.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BellOff className="w-4 h-4 text-theme-secondary" />
            <span className="text-sm font-medium text-theme-secondary">Past / Inactive</span>
          </div>
          <div className="space-y-3 opacity-50">
            <AnimatePresence>
              {past.map(reminder => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggle={toggleActive}
                  onEdit={() => { setEditReminder(reminder); setShowModal(true) }}
                  onDelete={deleteReminder}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!loading && reminders.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-theme-secondary mx-auto mb-3" />
          <h3 className="text-theme-secondary font-medium">No reminders yet</h3>
          <p className="text-theme-secondary text-sm mt-1">Set a reminder and never miss anything</p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2 px-4 mt-4">
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-xl" />)}</div>
      )}

      <AnimatePresence>
        {showModal && (
          <ReminderModal
            reminder={editReminder}
            onClose={() => { setShowModal(false); setEditReminder(null) }}
            onSave={async (data) => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return
              if (editReminder) {
                await supabase.from('reminders').update(data).eq('id', editReminder.id)
                toast.success('Reminder updated!')
              } else {
                await supabase.from('reminders').insert({ ...data, user_id: user.id, is_active: true })
                toast.success('🔔 Reminder set!')
              }
              setShowModal(false); setEditReminder(null); loadReminders()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ReminderCard({ reminder, onToggle, onEdit, onDelete }: {
  reminder: Reminder
  onToggle: (r: Reminder) => void
  onEdit: () => void
  onDelete: (id: string) => void
}) {
  const color = FREQ_COLORS[reminder.frequency]
  const dateObj = parseISO(reminder.remind_at)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-card p-4 flex items-center gap-4 group"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}>
        <Bell className="w-5 h-5" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-theme-primary">{reminder.title}</div>
        {reminder.description && <div className="text-xs text-theme-secondary mt-0.5 truncate">{reminder.description}</div>}
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1 text-xs text-theme-secondary">
            <Calendar className="w-3 h-3" />
            {format(dateObj, 'MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-1 text-xs text-theme-secondary">
            <Clock className="w-3 h-3" />
            {format(dateObj, 'h:mm a')}
          </div>
          {reminder.frequency !== 'once' && (
            <div className="flex items-center gap-1 text-xs" style={{ color }}>
              <Repeat className="w-3 h-3" />
              {FREQ_LABELS[reminder.frequency]}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggle(reminder)}
          className={cn('p-1.5 rounded-lg transition-all text-xs', reminder.is_active ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-theme-secondary hover:bg-theme-elevated')}
        >
          {reminder.is_active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-theme-elevated text-theme-secondary hover:text-theme-primary transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(reminder.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-theme-secondary hover:text-red-400 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ReminderModal({ reminder, onClose, onSave }: {
  reminder: Reminder | null
  onClose: () => void
  onSave: (data: Partial<Reminder>) => Promise<void>
}) {
  const defaultDate = reminder ? reminder.remind_at.split('T')[0] : new Date().toISOString().split('T')[0]
  const defaultTime = reminder ? reminder.remind_at.split('T')[1]?.slice(0, 5) : '09:00'

  const [title, setTitle] = useState(reminder?.title ?? '')
  const [description, setDescription] = useState(reminder?.description ?? '')
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState(defaultTime)
  const [frequency, setFrequency] = useState<ReminderFrequency>(reminder?.frequency ?? 'once')
  const [saving, setSaving] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm glass-strong rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-theme-primary">{reminder ? 'Edit Reminder' : 'New Reminder'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-elevated text-theme-secondary"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={async e => {
          e.preventDefault(); setSaving(true)
          const remind_at = new Date(`${date}T${time}`).toISOString()
          await onSave({ title, description: description || undefined, remind_at, frequency })
          setSaving(false)
        }} className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Remind me to..." required className="input-field text-sm" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional notes..." rows={2} className="input-field text-sm resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-theme-secondary mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-theme-secondary mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-theme-secondary mb-1">Repeat</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value as ReminderFrequency)} className="input-field text-sm">
              {(Object.entries(FREQ_LABELS) as [ReminderFrequency, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
            <button type="submit" disabled={saving || !title.trim()} className="btn-primary flex-1 py-2.5 text-sm justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : reminder ? 'Update' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
