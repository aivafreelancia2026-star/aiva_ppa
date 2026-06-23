'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, LayoutDashboard, CheckSquare, ShoppingCart,
  BarChart3, Bell, MessageSquare, Settings, LogOut,
  Menu, X, ChevronRight, Sparkles, Search,
  User, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User as UserType } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/chat', icon: MessageSquare, label: 'AI Chat', badge: 'AI' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/dashboard/shopping', icon: ShoppingCart, label: 'Shopping' },
  { href: '/dashboard/counters', icon: BarChart3, label: 'Counters' },
  { href: '/dashboard/reminders', icon: Bell, label: 'Reminders' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/auth/login'); return }
      setUser({
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.full_name ?? data.user.email ?? 'User',
        avatar_url: data.user.user_metadata?.avatar_url,
        preferred_model: 'gpt-4o-mini',
        created_at: data.user.created_at,
      })
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-white leading-none">AIVA AI</div>
            <div className="text-[10px] text-purple-400 font-medium mt-0.5">Productivity Assistant</div>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
          style={{ border: '1px solid rgba(139,92,246,0.1)' }}>
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">Quick search...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-600">⌘K</kbd>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
              isActive(item)
                ? 'nav-active'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <item.icon className={cn('w-4.5 h-4.5 flex-shrink-0', isActive(item) ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300')} size={18} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                {item.badge}
              </span>
            )}
            {isActive(item) && <ChevronRight className="w-3 h-3 text-purple-400" />}
          </Link>
        ))}
      </nav>

      {/* Settings + User */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/5 pt-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-4 h-4 text-slate-500" size={16} />
          Settings
        </Link>

        {user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs font-medium text-white truncate">{user.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
              <ChevronDown className={cn('w-3 h-3 transition-transform', userMenuOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden"
                  style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#0f0f1a] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-60 flex-shrink-0 glass-strong border-r border-white/5">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 glass-strong border-r border-white/5"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 lg:px-6 py-3.5 border-b border-white/5 glass-strong flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-slate-400"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-base font-semibold text-white">
              {NAV_ITEMS.find(n => isActive(n))?.label ?? 'AIVA AI'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/chat"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AIVA
            </Link>

            {user && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {user.name[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
