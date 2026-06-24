'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Brain, Bell, Shield, User, Save, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MODEL_CONFIG, cn } from '@/lib/utils'
import type { AIModel } from '@/types'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string; preferred_model: AIModel } | null>(null)
  const [name, setName] = useState('')
  const [model, setModel] = useState<AIModel>('gpt-4o-mini')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async (res: any) => {
      const data = res.data
      if (!data || !data.user) return
      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      const u = {
        name: profile?.name ?? data.user.user_metadata?.full_name ?? '',
        email: data.user.email ?? '',
        preferred_model: (profile?.preferred_model ?? 'gpt-4o-mini') as AIModel,
      }
      setUser(u)
      setName(u.name)
      setModel(u.preferred_model)
    })
  }, [])

  async function saveProfile() {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    await supabase.from('users').upsert({ id: authUser.id, name, email: authUser.email!, preferred_model: model })
    toast.success('Settings saved!')
    setSaving(false)
  }

  if (!user) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">Settings</h1>
        <p className="text-theme-secondary text-sm mt-0.5">Manage your AIVA AI preferences</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-theme-primary">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-theme-secondary mb-1.5 font-medium">Email</label>
            <input value={user.email} readOnly className="input-field text-sm opacity-50 cursor-not-allowed" />
          </div>
        </div>
      </motion.div>

      {/* AI Model */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Brain className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-theme-primary">Default AI Model</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.entries(MODEL_CONFIG) as [AIModel, typeof MODEL_CONFIG[AIModel]][]).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => setModel(id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                model === id
                  ? 'border-2 border-purple-500 bg-purple-500/10'
                  : 'border border-theme-border hover:border-purple-500/30 hover:bg-theme-elevated'
              )}
            >
              <span className="text-2xl">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-theme-primary">{cfg.label}</div>
                <div className="text-xs text-theme-secondary">{cfg.provider}</div>
              </div>
              {model === id && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
            </button>
          ))}
        </div>
        <p className="text-xs text-theme-secondary mt-3">You can switch models any time in the chat interface.</p>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="w-4 h-4 text-yellow-400" />
          <h2 className="font-semibold text-theme-primary">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Push Notifications', desc: 'Receive reminders on your device' },
            { label: 'Email Reminders', desc: 'Get task reminders by email' },
            { label: 'Daily Summary', desc: 'Daily digest of your tasks and reminders' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-theme-primary">{item.label}</div>
                <div className="text-xs text-theme-secondary">{item.desc}</div>
              </div>
              <div className="w-10 h-5 rounded-full bg-purple-600 relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Save */}
      <button onClick={saveProfile} disabled={saving} className="btn-primary w-full py-3 justify-center">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  )
}
