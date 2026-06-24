'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, LayoutDashboard, CheckSquare, ShoppingCart,
  BarChart3, Bell, MessageSquare, Settings, LogOut,
  Menu, X, ChevronRight, Sparkles, Search,
  User, ChevronDown, Calendar, Sun, Moon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User as UserType } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/chat', icon: MessageSquare, label: 'AI Chat', badge: 'AI' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/dashboard/shopping', icon: ShoppingCart, label: 'Shopping' },
  { href: '/dashboard/counters', icon: BarChart3, label: 'Counters' },
  { href: '/dashboard/reminders', icon: Bell, label: 'Reminders' },
]


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Sync theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
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
      <div className="px-4 py-5 border-b border-theme-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-theme-primary leading-none">AIVA AI</div>
            <div className="text-[10px] text-[var(--accent-purple)] font-medium mt-0.5">Productivity Assistant</div>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors hover:bg-theme-elevated border border-theme-border">
          <Search className="w-3.5 h-3.5 text-theme-secondary" />
          <span className="text-xs text-theme-secondary">Quick search...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-theme-elevated text-theme-muted">⌘K</kbd>
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
                : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-elevated'
            )}
          >
            <item.icon className={cn('w-4.5 h-4.5 flex-shrink-0', isActive(item) ? 'text-accent-purple' : 'text-theme-secondary group-hover:text-theme-primary')} size={18} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-accent-purple/10 text-accent-purple">
                {item.badge}
              </span>
            )}
            {isActive(item) && <ChevronRight className="w-3 h-3 text-accent-purple" />}
          </Link>
        ))}
      </nav>

      {/* Settings + User */}
      <div className="px-3 pb-4 space-y-1 border-t border-theme-border pt-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-elevated transition-all"
        >
          <Settings className="w-4 h-4 text-theme-muted" size={16} />
          Settings
        </Link>

        {user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-elevated transition-all"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs font-medium text-theme-primary truncate">{user.name}</div>
                <div className="text-[10px] text-theme-muted truncate">{user.email}</div>
              </div>
              <ChevronDown className={cn('w-3 h-3 transition-transform text-theme-secondary', userMenuOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden bg-theme-panel border border-theme-border"
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
    <div className="flex h-screen bg-theme-bg overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-60 flex-shrink-0 glass-strong border-r border-theme-border">
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
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 glass-strong border-r border-theme-border"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-theme-elevated">
                  <X className="w-4 h-4 text-theme-secondary" />
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
        <header className="flex items-center gap-4 px-4 lg:px-6 py-3.5 border-b border-theme-border glass-strong flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-theme-elevated text-theme-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-base font-semibold text-theme-primary">
              {NAV_ITEMS.find(n => isActive(n))?.label ?? 'AIVA AI'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-theme-elevated border border-theme-border hover:border-theme-border/50 text-theme-secondary hover:text-theme-primary transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            </button>

            <Link
              href="/dashboard/chat"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-accent-purple/10 text-accent-purple border border-theme-border hover:bg-accent-purple/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AIVA
            </Link>

            {user && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
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
