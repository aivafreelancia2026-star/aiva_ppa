'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, RotateCcw, Trash2, Edit2, X,
  BarChart3, Loader2, Target, TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Counter } from '@/types'
import toast from 'react-hot-toast'

const PRESET_COUNTERS = [
  { name: 'Water Intake', icon: '💧', unit: 'glasses', target: 8, color: '#06b6d4', reset_daily: true },
  { name: 'Exercise', icon: '🏋️', unit: 'mins', target: 30, color: '#10b981', reset_daily: true },
  { name: 'Reading', icon: '📚', unit: 'pages', target: 20, color: '#8b5cf6', reset_daily: true },
  { name: 'Steps', icon: '👟', unit: 'steps', target: 10000, color: '#f59e0b', reset_daily: true },
  { name: 'Expenses', icon: '💰', unit: '₹', color: '#f87171', reset_daily: false },
  { name: 'Mood', icon: '😊', unit: '/10', target: 10, color: '#ec4899', reset_daily: true },
]

export default function CountersPage() {
  const [counters, setCounters] = useState<Counter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCounter, setEditCounter] = useState<Counter | null>(null)
  const [incrementing, setIncrementing] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { loadCounters() }, [])

  async function loadCounters() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('counters').select('*').eq('user_id', user.id).order('created_at')
    setCounters(data ?? [])
    setLoading(false)
  }

  async function increment(counter: Counter, amount = 1) {
    setIncrementing(counter.id)
    const newVal = counter.value + amount
    const { error } = await supabase.from('counters').update({ value: newVal }).eq('id', counter.id)
    if (error) { toast.error('Failed'); setIncrementing(null); return }
    setCounters(prev => prev.map(c => c.id === counter.id ? { ...c, value: newVal } : c))
    if (counter.target && newVal >= counter.target) toast.success(`🎯 Goal reached for ${counter.name}!`)
    setIncrementing(null)
  }

  async function decrement(counter: Counter) {
    if (counter.value <= 0) return
    const newVal = counter.value - 1
    await supabase.from('counters').update({ value: newVal }).eq('id', counter.id)
    setCounters(prev => prev.map(c => c.id === counter.id ? { ...c, value: newVal } : c))
  }

  async function reset(counter: Counter) {
    await supabase.from('counters').update({ value: 0, last_reset: new Date().toISOString().split('T')[0] }).eq('id', counter.id)
    setCounters(prev => prev.map(c => c.id === counter.id ? { ...c, value: 0 } : c))
    toast.success(`${counter.name} reset to 0`)
  }

  async function deleteCounter(id: string) {
    await supabase.from('counters').delete().eq('id', id)
    setCounters(prev => prev.filter(c => c.id !== id))
    toast.success('Counter deleted')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Counters & Trackers</h1>
          <p className="text-slate-400 text-sm mt-0.5">{counters.length} active trackers</p>
        </div>
        <button onClick={() => { setEditCounter(null); setShowModal(true) }} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> New Counter
        </button>
      </div>

      {/* Presets (if no counters) */}
      {!loading && counters.length === 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Quick Start with a preset:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_COUNTERS.map(preset => (
              <button
                key={preset.name}
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return
                  await supabase.from('counters').insert({ ...preset, user_id: user.id, value: 0 })
                  toast.success(`${preset.icon} ${preset.name} counter created!`)
                  loadCounters()
                }}
                className="flex items-center gap-2 p-3 rounded-xl text-left transition-all hover:scale-105"
                style={{ background: `${preset.color}15`, border: `1px solid ${preset.color}25` }}
              >
                <span className="text-xl">{preset.icon}</span>
                <div>
                  <div className="text-xs font-medium text-white">{preset.name}</div>
                  {preset.target && <div className="text-[10px] text-slate-500">Goal: {preset.target} {preset.unit}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Counters Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {counters.map(counter => {
              const progress = counter.target ? Math.min((counter.value / counter.target) * 100, 100) : null
              const color = counter.color ?? '#8b5cf6'
              return (
                <motion.div
                  key={counter.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-5 group relative"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{counter.icon ?? '🔢'}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{counter.name}</div>
                        {counter.description && <div className="text-xs text-slate-500 mt-0.5">{counter.description}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditCounter(counter); setShowModal(true) }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCounter(counter.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-center my-4">
                    <div className="text-4xl font-black" style={{ color }}>{counter.value}</div>
                    {counter.unit && <div className="text-xs text-slate-500 mt-1">{counter.unit}</div>}
                    {counter.target && (
                      <div className="text-xs text-slate-600 mt-0.5">/ {counter.target} {counter.unit}</div>
                    )}
                  </div>

                  {/* Progress */}
                  {progress !== null && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Goal</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrement(counter)}
                      disabled={counter.value === 0}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 disabled:opacity-30 text-slate-400"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => increment(counter)}
                      disabled={incrementing === counter.id}
                      className="flex-1 h-9 rounded-xl flex items-center justify-center font-semibold text-sm text-white transition-all hover:scale-105 active:scale-95"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 0 16px ${color}40` }}
                    >
                      {incrementing === counter.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />+1</>}
                    </button>
                    <button
                      onClick={() => reset(counter)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 text-slate-400"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <CounterModal
            counter={editCounter}
            onClose={() => { setShowModal(false); setEditCounter(null) }}
            onSave={async (data) => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return
              if (editCounter) {
                await supabase.from('counters').update(data).eq('id', editCounter.id)
                toast.success('Counter updated!')
              } else {
                await supabase.from('counters').insert({ ...data, user_id: user.id, value: 0 })
                toast.success('Counter created!')
              }
              setShowModal(false); setEditCounter(null); loadCounters()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CounterModal({ counter, onClose, onSave }: {
  counter: Counter | null
  onClose: () => void
  onSave: (data: Partial<Counter>) => Promise<void>
}) {
  const [name, setName] = useState(counter?.name ?? '')
  const [icon, setIcon] = useState(counter?.icon ?? '🔢')
  const [unit, setUnit] = useState(counter?.unit ?? '')
  const [target, setTarget] = useState(counter?.target?.toString() ?? '')
  const [color, setColor] = useState(counter?.color ?? '#8b5cf6')
  const [resetDaily, setResetDaily] = useState(counter?.reset_daily ?? false)
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
          <h2 className="text-lg font-semibold text-white">{counter ? 'Edit Counter' : 'New Counter'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave({ name, icon, unit: unit || undefined, target: target ? Number(target) : undefined, color, reset_daily: resetDaily }); setSaving(false) }} className="space-y-3">
          <div className="flex gap-3">
            <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="🔢" className="input-field text-sm w-16 text-center text-xl" maxLength={2} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Counter name *" required className="input-field text-sm flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit (glasses, km…)" className="input-field text-sm" />
            <input value={target} onChange={e => setTarget(e.target.value)} type="number" min="1" placeholder="Goal (optional)" className="input-field text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Color:</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setResetDaily(!resetDaily)}
              className={cn('w-10 h-5 rounded-full transition-colors relative', resetDaily ? 'bg-purple-600' : 'bg-slate-700')}
            >
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform', resetDaily ? 'left-5' : 'left-0.5')} />
            </div>
            <span className="text-xs text-slate-400">Reset daily at midnight</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1 py-2.5 text-sm justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : counter ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
