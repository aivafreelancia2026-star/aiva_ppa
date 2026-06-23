'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, CheckSquare, ShoppingCart, BarChart3, Bell,
  MessageSquare, Sparkles, ArrowRight, Star, Shield, Globe,
  ChevronRight, Play, Github
} from 'lucide-react'

const DEMO_MESSAGES = [
  { user: 'Add task "Review project proposal" with high priority due tomorrow', ai: '✅ Task created! "Review project proposal" — High priority, due tomorrow.' },
  { user: 'Add 2kg rice and milk to shopping list', ai: '🛒 Added! 2kg rice & milk are in your shopping list.' },
  { user: 'Increase my water counter by 2', ai: '💧 Done! Water intake: 4 glasses today. 4 more to hit your goal!' },
  { user: 'Remind me to call mom at 8 PM today', ai: '🔔 Reminder set! I\'ll notify you at 8:00 PM to call mom.' },
  { user: 'Show me today\'s tasks', ai: '📋 You have 3 tasks today:\n1. Review project proposal (High ⚡)\n2. Send report (Medium)\n3. Gym workout (Low)' },
]

const FEATURES = [
  { icon: CheckSquare, label: 'Task Manager', desc: 'Full CRUD with priorities, categories, and smart due dates', color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
  { icon: ShoppingCart, label: 'Shopping List', desc: 'Add items naturally. "Add 2kg rice" just works.', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
  { icon: BarChart3, label: 'Counters & Trackers', desc: 'Track water, exercise, habits, expenses — anything.', color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  { icon: Bell, label: 'Smart Reminders', desc: 'One-time or recurring. Natural language scheduling.', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  { icon: MessageSquare, label: 'AI Chat Agent', desc: 'Execute multiple actions from a single message.', color: '#ec4899', glow: 'rgba(236,72,153,0.3)' },
  { icon: Brain, label: 'Multi-Model AI', desc: 'Choose GPT-4o, Gemini, or Claude — all in one place.', color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
]

const MODELS = [
  { name: 'GPT-4o', provider: 'OpenAI', icon: '🤖', color: '#10a37f' },
  { name: 'Gemini 1.5 Pro', provider: 'Google', icon: '💎', color: '#4285f4' },
  { name: 'Claude 3.5', provider: 'Anthropic', icon: '🎭', color: '#cc785c' },
]

export default function LandingPage() {
  const [demoIdx, setDemoIdx] = useState(0)
  const [aiResponse, setAiResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeModel, setActiveModel] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoIdx(i => (i + 1) % DEMO_MESSAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setAiResponse('')
    setIsTyping(true)
    const text = DEMO_MESSAGES[demoIdx].ai
    let i = 0
    const t = setInterval(() => {
      i++
      setAiResponse(text.slice(0, i))
      if (i >= text.length) { clearInterval(t); setIsTyping(false) }
    }, 25)
    return () => clearInterval(t)
  }, [demoIdx])

  useEffect(() => {
    const t = setInterval(() => setActiveModel(m => (m + 1) % MODELS.length), 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0f0f1a] overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[600px] h-[600px] bg-violet-600/20 top-[-200px] left-[-100px]" />
        <div className="orb w-[500px] h-[500px] bg-indigo-600/15 bottom-[-200px] right-[-100px]" />
        <div className="orb w-[400px] h-[400px] bg-cyan-600/10 top-[40%] left-[40%]" />
        <div className="bg-grid absolute inset-0 opacity-30" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-16 py-5 glass-strong sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">AIVA AI</span>
          <span className="hidden sm:block text-xs text-slate-500 font-medium mt-0.5">by AIVA Freelancia</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          <a href="#models" className="hover:text-white transition-colors">AI Models</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link href="/auth/login" className="btn-primary text-sm py-2 px-5">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Multi-Model AI Agent · GPT-4o · Gemini · Claude
          </div>

          <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-6 tracking-tight">
            Your Life, Managed by{' '}
            <span className="gradient-text">AIVA AI</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            One intelligent agent that handles your tasks, shopping lists, habit trackers,
            and reminders — all through natural conversation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login" className="btn-primary text-base px-8 py-4 w-full sm:w-auto justify-center">
              <Zap className="w-5 h-5" />
              Start for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="btn-secondary text-base px-8 py-4 w-full sm:w-auto justify-center">
              <Play className="w-4 h-4" />
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Hero Demo Window */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 max-w-2xl mx-auto"
          id="demo"
        >
          <div className="glass-card overflow-hidden rounded-2xl shadow-2xl" style={{ boxShadow: '0 0 60px rgba(139,92,246,0.2)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="flex-1 flex items-center justify-center">
                <div className="px-4 py-1 rounded-md text-xs text-slate-500 font-mono bg-black/20">
                  AIVA AI Chat
                </div>
              </div>
              {/* Model badge */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModel}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: `${MODELS[activeModel].color}20`, color: MODELS[activeModel].color }}
                >
                  {MODELS[activeModel].icon} {MODELS[activeModel].name}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Chat */}
            <div className="p-6 space-y-4 min-h-[240px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={demoIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <div className="flex justify-end">
                    <div className="chat-user px-4 py-3 max-w-xs text-sm text-white">
                      {DEMO_MESSAGES[demoIdx].user}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="chat-ai px-4 py-3 max-w-xs text-sm text-slate-200 whitespace-pre-wrap">
                      {aiResponse}
                      {isTyping && <span className="inline-block w-1.5 h-4 bg-purple-400 ml-0.5 animate-pulse rounded-sm" />}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <input
                  readOnly
                  placeholder="Type anything... 'Add task', 'Remind me', 'Add to shopping list'"
                  className="flex-1 bg-transparent text-sm text-slate-400 placeholder-slate-600 outline-none"
                />
                <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Everything you need,{' '}
            <span className="gradient-text">in one agent</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            AIVA understands intent. Just talk — it handles the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                style={{ background: `${f.color}20`, boxShadow: `0 0 20px ${f.glow}` }}>
                <f.icon className="w-6 h-6" style={{ color: f.color }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.label}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Models */}
      <section id="models" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Choose your <span className="gradient-text">AI Model</span>
          </h2>
          <p className="text-slate-400 text-lg">Switch between providers without losing your data or context.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {MODELS.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card p-6 text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="text-4xl mb-3">{m.icon}</div>
              <div className="text-lg font-bold text-white">{m.name}</div>
              <div className="text-sm mt-1" style={{ color: m.color }}>{m.provider}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 lg:px-16 py-24 text-center">
        <div className="glass-card p-12 relative overflow-hidden">
          <div className="orb w-[300px] h-[300px] bg-violet-600/20 top-[-100px] left-[-100px]" />
          <div className="orb w-[250px] h-[250px] bg-cyan-600/15 bottom-[-80px] right-[-80px]" />
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-black mb-4">
              Ready to be more <span className="gradient-text">productive?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Join the future of personal productivity. Free to start.
            </p>
            <Link href="/auth/login" className="btn-primary text-lg px-10 py-4 inline-flex">
              <Sparkles className="w-5 h-5" />
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 lg:px-16 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Brain className="w-4 h-4 text-purple-500" />
            <span>AIVA AI · Built by <a href="https://aivafreelancia.com" className="text-purple-400 hover:text-purple-300">AIVA Freelancia</a></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span>© 2026 AIVA Freelancia</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
