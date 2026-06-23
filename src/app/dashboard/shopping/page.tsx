'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Check, Trash2, ShoppingCart,
  Edit2, X, Loader2, ShoppingBag, Package
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { ShoppingItem } from '@/types'
import toast from 'react-hot-toast'

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Other']

const CATEGORY_COLORS: Record<string, string> = {
  Produce: '#10b981', Dairy: '#06b6d4', Meat: '#f87171', Bakery: '#f59e0b',
  Beverages: '#8b5cf6', Snacks: '#ec4899', Household: '#64748b', 'Personal Care': '#a78bfa', Other: '#94a3b8',
}

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all')
  const supabase = createClient()

  useEffect(() => { loadItems() }, [filter])

  async function loadItems() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let q = supabase.from('shopping_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (filter === 'pending') q = q.eq('is_purchased', false)
    if (filter === 'purchased') q = q.eq('is_purchased', true)
    const { data } = await q
    setItems(data ?? [])
    setLoading(false)
  }

  async function togglePurchased(item: ShoppingItem) {
    const { error } = await supabase.from('shopping_items').update({ is_purchased: !item.is_purchased }).eq('id', item.id)
    if (error) { toast.error('Failed to update'); return }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_purchased: !i.is_purchased } : i))
    toast.success(item.is_purchased ? 'Marked as pending' : '✅ Purchased!')
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('shopping_items').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Item removed')
  }

  async function clearPurchased() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('shopping_items').delete().eq('user_id', user.id).eq('is_purchased', true)
    if (error) { toast.error('Failed'); return }
    setItems(prev => prev.filter(i => !i.is_purchased))
    toast.success('Cleared purchased items')
  }

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = items.filter(i => !i.is_purchased).length
  const purchasedCount = items.filter(i => i.is_purchased).length

  // Group by category
  const grouped = filtered.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.category ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Shopping List</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {pendingCount} item{pendingCount !== 1 ? 's' : ''} to buy · {purchasedCount} purchased
          </p>
        </div>
        <div className="flex gap-2 self-start">
          {purchasedCount > 0 && (
            <button onClick={clearPurchased} className="btn-secondary text-sm py-2 px-4">
              Clear done
            </button>
          )}
          <button onClick={() => { setEditItem(null); setShowModal(true) }} className="btn-primary text-sm py-2.5">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Shopping progress</span>
            <span>{purchasedCount}/{items.length}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(purchasedCount / items.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="input-field pl-10 text-sm" />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-purple-500/20">
          {(['all', 'pending', 'purchased'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('px-4 py-2 text-xs font-medium capitalize transition-colors', filter === f ? 'bg-purple-600/30 text-purple-300' : 'text-slate-500 hover:text-white')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 shimmer rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-slate-400 font-medium">Your shopping list is empty</h3>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2 px-4 mt-4">
            <Plus className="w-4 h-4" /> Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[category] ?? '#8b5cf6' }} />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{category}</span>
                <span className="text-xs text-slate-600">{catItems.filter(i => !i.is_purchased).length} left</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {catItems.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn('glass-card p-3.5 flex items-center gap-3 group', item.is_purchased && 'opacity-50')}
                    >
                      <button
                        onClick={() => togglePurchased(item)}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          item.is_purchased
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-600 hover:border-cyan-400'
                        )}
                      >
                        {item.is_purchased && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={cn('text-sm font-medium text-white', item.is_purchased && 'line-through text-slate-500')}>
                          {item.name}
                        </span>
                        {(item.quantity || item.notes) && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.quantity && `${item.quantity}${item.unit ? ' ' + item.unit : ''}`}
                            {item.quantity && item.notes && ' · '}
                            {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(item); setShowModal(true) }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ShoppingModal
            item={editItem}
            onClose={() => { setShowModal(false); setEditItem(null) }}
            onSave={async (data) => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return
              if (editItem) {
                await supabase.from('shopping_items').update(data).eq('id', editItem.id)
                toast.success('Item updated!')
              } else {
                await supabase.from('shopping_items').insert({ ...data, user_id: user.id })
                toast.success('Item added!')
              }
              setShowModal(false); setEditItem(null); loadItems()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ShoppingModal({ item, onClose, onSave }: {
  item: ShoppingItem | null
  onClose: () => void
  onSave: (data: Partial<ShoppingItem>) => Promise<void>
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? '')
  const [unit, setUnit] = useState(item?.unit ?? '')
  const [category, setCategory] = useState(item?.category ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
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
          <h2 className="text-lg font-semibold text-white">{item ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave({ name, quantity: quantity ? Number(quantity) : undefined, unit: unit || undefined, category: category || undefined, notes: notes || undefined }); setSaving(false) }} className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name *" required className="input-field text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="0" step="0.1" placeholder="Qty" className="input-field text-sm" />
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit (kg, pcs…)" className="input-field text-sm" />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="input-field text-sm">
            <option value="">Category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className="input-field text-sm" />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1 py-2.5 text-sm justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : item ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
