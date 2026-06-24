'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, CheckSquare, ShoppingCart, BarChart3, Bell,
  MessageSquare, Sparkles, ArrowRight, Play, ChevronRight,
  Terminal, Send, Layers, Cpu, Sun, Moon,
} from 'lucide-react'

const DEMO_MESSAGES = [
  { user: 'Add task "Review project proposal" with high priority due tomorrow', ai: '✅ Task created! "Review project proposal" — High priority, due tomorrow.', category: 'tasks' },
  { user: 'Add 2kg rice and milk to shopping list', ai: '🛒 Added! 2kg rice & milk are in your shopping list.', category: 'shopping' },
  { user: 'Increase my water counter by 2', ai: '💧 Done! Water intake: 4 glasses today. 4 more to hit your goal!', category: 'counters' },
  { user: "Remind me to call mom at 8 PM today", ai: "🔔 Reminder set! I'll notify you at 8:00 PM to call mom.", category: 'reminders' },
  { user: "Show me today's tasks", ai: "📋 You have 3 tasks today:\n1. Review project proposal (High ⚡)\n2. Send report (Medium)\n3. Gym workout (Low)", category: 'tasks' },
]

const COMMAND_EXAMPLES = [
  {
    category: 'Tasks', key: 'tasks', icon: CheckSquare, color: '#14b8a6',
    bg: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.30)',
    commands: [
      'Add task "Review project proposal" high priority due tomorrow',
      "Show me today's incomplete tasks",
      'Mark my gym task as done',
    ],
  },
  {
    category: 'Shopping', key: 'shopping', icon: ShoppingCart, color: '#06b6d4',
    bg: 'rgba(6,182,212,0.10)', border: 'rgba(6,182,212,0.30)',
    commands: [
      'Add 2kg rice and milk to shopping list',
      "What's on my shopping list?",
      'Remove eggs from shopping list',
    ],
  },
  {
    category: 'Reminders', key: 'reminders', icon: Bell, color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)',
    commands: [
      'Remind me to call mom at 8 PM today',
      'Set daily reminder for 9 AM standup',
      'Delete my 7 PM reminder',
    ],
  },
  {
    category: 'Counters', key: 'counters', icon: BarChart3, color: '#10b981',
    bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)',
    commands: [
      'Increase my water counter by 2',
      'Add 45 minutes to my exercise tracker',
      'Reset my daily coffee counter',
    ],
  },
]

const FEATURES = [
  { icon: CheckSquare, label: 'Task Manager',       desc: 'Full CRUD with priorities, categories, and smart due dates',  color: '#14b8a6', glow: 'rgba(20,184,166,0.25)', num: '01' },
  { icon: ShoppingCart, label: 'Shopping List',      desc: 'Add items naturally. "Add 2kg rice" just works.',              color: '#06b6d4', glow: 'rgba(6,182,212,0.25)',  num: '02' },
  { icon: BarChart3,    label: 'Counters & Trackers',desc: 'Track water, exercise, habits, expenses — anything.',          color: '#10b981', glow: 'rgba(16,185,129,0.25)',num: '03' },
  { icon: Bell,         label: 'Smart Reminders',    desc: 'One-time or recurring. Natural language scheduling.',          color: '#f59e0b', glow: 'rgba(245,158,11,0.25)',num: '04' },
  { icon: MessageSquare,label: 'AI Chat Agent',      desc: 'Execute multiple actions from a single message.',              color: '#ec4899', glow: 'rgba(236,72,153,0.25)',num: '05' },
  { icon: Brain,        label: 'Multi-Model AI',     desc: 'Choose GPT-4o, Gemini, or Claude — all in one place.',        color: '#14b8a6', glow: 'rgba(20,184,166,0.25)',num: '06' },
]

const MODELS = [
  { name: 'GPT-4o',         provider: 'OpenAI',    icon: '🤖', color: '#10a37f', features: ['Advanced reasoning', 'Vision support', 'Function calling'] },
  { name: 'Gemini 1.5 Pro', provider: 'Google',    icon: '💎', color: '#4285f4', features: ['Long context',       'Multimodal',       'Fast responses'] },
  { name: 'Claude 3.5',     provider: 'Anthropic', icon: '🎭', color: '#cc785c', features: ['Precise writing',   'Safety-focused',   'Deep analysis'] },
]

const STEPS = [
  { n: '01', title: 'Type naturally',    desc: 'Say what you need in plain English — no commands to memorize, no forms to fill.',   icon: Terminal },
  { n: '02', title: 'AIVA understands',  desc: 'The AI parses your intent and executes across all your productivity modules.',       icon: Cpu },
  { n: '03', title: 'Stay organized',    desc: 'Your tasks, lists, reminders, and trackers are always up to date — effortlessly.',  icon: Layers },
]

export default function LandingPage() {
  const [demoIdx,        setDemoIdx]       = useState(0)
  const [aiResponse,     setAiResponse]    = useState('')
  const [isTyping,       setIsTyping]      = useState(false)
  const [activeModel,    setActiveModel]   = useState(0)
  const [activeCategory, setActiveCategory]= useState(0)
  const [isDark,         setIsDark]        = useState(true)
  const [mounted,        setMounted]       = useState(false)

  // Sync theme state from DOM (set by the inline script in layout.tsx)
  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('aiva-theme', next ? 'dark' : 'light') } catch { /* */ }
  }

  // Cycle demo messages
  useEffect(() => {
    const id = setInterval(() => {
      setDemoIdx(i => {
        const next = (i + 1) % DEMO_MESSAGES.length
        const catIdx = COMMAND_EXAMPLES.findIndex(c => c.key === DEMO_MESSAGES[next].category)
        if (catIdx !== -1) setActiveCategory(catIdx)
        return next
      })
    }, 4200)
    return () => clearInterval(id)
  }, [])

  // Typewriter effect
  useEffect(() => {
    setAiResponse('')
    setIsTyping(true)
    const text = DEMO_MESSAGES[demoIdx].ai
    let i = 0
    const t = setInterval(() => {
      i++
      setAiResponse(text.slice(0, i))
      if (i >= text.length) { clearInterval(t); setIsTyping(false) }
    }, 22)
    return () => clearInterval(t)
  }, [demoIdx])

  // Cycle AI model badge
  useEffect(() => {
    const t = setInterval(() => setActiveModel(m => (m + 1) % MODELS.length), 2500)
    return () => clearInterval(t)
  }, [])

  // Computed colors that adapt per mode
  const badgeTextColor  = isDark ? '#5eead4' : '#0d9488'
  const pillTextColor   = isDark ? '#2dd4bf'  : '#0d9488'
  const pillBg          = isDark ? 'rgba(20,184,166,0.07)'  : 'rgba(13,148,136,0.06)'
  const pillBorder      = isDark ? 'rgba(20,184,166,0.15)'  : 'rgba(13,148,136,0.18)'
  const badgeBg         = isDark ? 'rgba(20,184,166,0.10)'  : 'rgba(13,148,136,0.07)'
  const badgeBorder     = isDark ? 'rgba(20,184,166,0.22)'  : 'rgba(13,148,136,0.22)'
  const navBg           = isDark ? 'rgb(5 8 14 / 0.88)'     : 'rgb(248 250 252 / 0.90)'
  const navBorder       = isDark ? 'rgba(20,184,166,0.07)'  : 'rgba(13,148,136,0.10)'
  const inputBg         = isDark ? 'rgb(5 8 14 / 0.85)'     : 'rgb(243 239 230 / 0.90)'
  const monoBarBg       = isDark ? 'rgba(0,0,0,0.35)'       : 'rgba(0,0,0,0.05)'
  const windowChromeBg  = isDark ? 'rgba(20,184,166,0.03)'  : 'rgba(13,148,136,0.02)'
  const windowChromeBrd = isDark ? 'rgba(20,184,166,0.08)'  : 'rgba(13,148,136,0.10)'
  const statLabelColor  = isDark ? '#475569' : '#94a3b8'

  return (
    <div
      className="relative min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{ background: 'rgb(var(--bg-primary))' }}
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[700px] h-[700px] bg-teal-500/20 top-[-250px] left-[-180px]" />
        <div className="orb w-[500px] h-[500px] bg-teal-600/15 bottom-[-200px] right-[-120px]" />
        <div className="orb w-[300px] h-[300px] bg-cyan-600/10 top-[45%] left-[45%]" />
        <div className="bg-grid absolute inset-0 opacity-100" />
      </div>

      {/* ── Nav ── */}
      <nav
        className="relative z-50 flex items-center justify-between px-6 lg:px-20 py-4 sticky top-0 transition-colors duration-300"
        style={{ background: navBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${navBorder}` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight gradient-text leading-tight">AIVA AI</div>
            <div className="hidden sm:block text-[10px] font-medium leading-tight" style={{ color: statLabelColor }}>by AIVA Freelancia</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          {[['Features', '#features'], ['How It Works', '#how-it-works'], ['Demo', '#demo'], ['AI Models', '#ai-models']].map(([label, href]) => (
            <a key={label} href={href} className="relative group py-1 hover:text-[rgb(var(--text-primary))] transition-colors duration-200">
              {label}
              <span className="absolute bottom-0 left-0 w-0 h-px bg-teal-500 group-hover:w-full transition-all duration-300 rounded-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle — only render after mount to avoid hydration mismatch */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="theme-toggle"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? 'moon' : 'sun'}
                  initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                  exit={{    opacity: 0, rotate:  30, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark
                    ? <Sun  className="w-4 h-4" />
                    : <Moon className="w-4 h-4" />
                  }
                </motion.div>
              </AnimatePresence>
            </button>
          )}

          <Link href="/auth/login" className="hidden sm:block text-sm px-4 py-2 transition-colors duration-200"
            style={{ color: 'rgb(var(--text-secondary))' }}>
            Sign in
          </Link>
          <Link href="/auth/login" className="btn-primary text-sm py-2 px-5">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-20 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-widest uppercase"
            style={{ background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeTextColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Multi-Model AI · GPT-4o · Gemini · Claude 3.5
          </motion.div>

          <h1 className="text-6xl lg:text-8xl font-black leading-[0.92] mb-6 tracking-tight">
            Your life,<br />
            <span className="gradient-text">managed by AI.</span>
          </h1>

          <p className="text-xl max-w-xl mx-auto mb-10 leading-relaxed font-light" style={{ color: 'rgb(var(--text-secondary))' }}>
            One agent. Natural language. Tasks, shopping lists, reminders, and habit trackers — all in one conversation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
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

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-10 flex-wrap">
            {[['4', 'Productivity modules'], ['3', 'AI models'], ['∞', 'Natural commands'], ['0', 'Commands to memorize']].map(([n, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black gradient-text">{n}</div>
                <div className="text-xs mt-0.5 tracking-wide" style={{ color: statLabelColor }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── How to Use — Enhanced Demo Section ── */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
            style={{ background: pillBg, border: `1px solid ${pillBorder}`, color: pillTextColor }}
          >
            How to use AIVA
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
            Talk to AIVA,{' '}
            <span className="gradient-text">get things done</span>
          </h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgb(var(--text-secondary))' }}>
            Just describe what you need. AIVA understands intent and acts across all your productivity modules — instantly.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left — Animated chat window */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="glass-card overflow-hidden rounded-2xl"
              style={{ boxShadow: isDark
                ? '0 0 80px rgba(20,184,166,0.12), 0 0 1px rgba(20,184,166,0.25)'
                : '0 4px 24px rgba(13,148,136,0.10), 0 0 0 1px rgba(13,148,136,0.08)'
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center gap-2 px-5 py-4 border-b"
                style={{ borderColor: windowChromeBrd, background: windowChromeBg }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/55" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/55" />
                  <div className="w-3 h-3 rounded-full bg-green-500/55" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="px-4 py-1 rounded-md text-xs font-mono" style={{ background: monoBarBg, color: 'rgb(var(--text-muted))' }}>
                    aiva.chat — AIVA AI
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeModel}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{
                      background: `${MODELS[activeModel].color}18`,
                      color: MODELS[activeModel].color,
                      border: `1px solid ${MODELS[activeModel].color}28`,
                    }}
                  >
                    {MODELS[activeModel].icon} {MODELS[activeModel].name}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Chat messages */}
              <div className="p-6 space-y-4 min-h-[260px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={demoIdx}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="flex justify-end">
                      <div className="chat-user px-4 py-3 max-w-[82%] text-sm">
                        {DEMO_MESSAGES[demoIdx].user}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)', boxShadow: '0 0 18px rgba(20,184,166,0.35)' }}
                      >
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="chat-ai px-4 py-3 max-w-[82%] text-sm whitespace-pre-wrap">
                        {aiResponse}
                        {isTyping && <span className="inline-block w-1.5 h-4 bg-teal-400 ml-0.5 animate-pulse rounded-sm" />}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 pb-4">
                {DEMO_MESSAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDemoIdx(i)
                      const catIdx = COMMAND_EXAMPLES.findIndex(c => c.key === DEMO_MESSAGES[i].category)
                      if (catIdx !== -1) setActiveCategory(catIdx)
                    }}
                    aria-label={`Demo message ${i + 1}`}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === demoIdx ? 20 : 6, height: 6,
                      background: i === demoIdx ? '#14b8a6' : 'rgba(20,184,166,0.22)',
                    }}
                  />
                ))}
              </div>

              {/* Input bar */}
              <div className="px-5 pb-5">
                <div
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-300"
                  style={{ background: inputBg, border: '1px solid rgba(var(--border), var(--border-opacity))' }}
                >
                  <input
                    readOnly
                    placeholder="Type anything... 'Add task', 'Remind me', 'Add to shopping list'"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  />
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — Command examples, synced to active demo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: statLabelColor }}>
              Try these commands
            </p>
            <div className="space-y-3">
              {COMMAND_EXAMPLES.map((cat, i) => {
                const isActive = activeCategory === i
                return (
                  <motion.div
                    key={cat.category}
                    onClick={() => setActiveCategory(i)}
                    className="rounded-2xl p-4 cursor-pointer transition-all duration-300"
                    style={{
                      background: isActive ? cat.bg : 'rgba(var(--bg-tertiary), 0.3)',
                      border: `1px solid ${isActive ? cat.border : 'rgba(var(--border), 0.06)'}`,
                      boxShadow: isActive ? `0 0 28px ${cat.color}0f` : 'none',
                    }}
                    layout
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}20` }}>
                        <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <span
                        className="font-bold text-sm transition-colors duration-200"
                        style={{ color: isActive ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))' }}
                      >
                        {cat.category}
                      </span>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold tracking-widest uppercase"
                          style={{ background: `${cat.color}22`, color: cat.color }}
                        >
                          Live
                        </motion.span>
                      )}
                    </div>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden space-y-2.5"
                        >
                          {cat.commands.map((cmd, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: cat.color }} />
                              <span className="text-xs font-mono leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                                &ldquo;{cmd}&rdquo;
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
            <p className="text-xs mt-6 leading-relaxed" style={{ color: statLabelColor }}>
              These are just examples — AIVA understands thousands of natural variations. No exact phrasing required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works — 3 steps ── */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight">
            Simple by design
          </h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 relative">
          <div
            className="hidden lg:block absolute top-10 left-[calc(33.33%_+_12px)] right-[calc(33.33%_+_12px)] h-px"
            style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.35), rgba(20,184,166,0.35))' }}
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.55 }}
            >
              <div className="glass-card p-8 h-full relative overflow-hidden group">
                <div
                  className="absolute top-4 right-4 text-7xl font-black leading-none pointer-events-none select-none transition-opacity duration-500 group-hover:opacity-60"
                  style={{ color: 'rgba(20,184,166,0.07)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {step.n}
                </div>
                <div className="relative z-10">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.20)' }}
                  >
                    <step.icon className="w-5 h-5 text-teal-500" />
                  </div>
                  <h3 className="text-xl font-black mb-2 tracking-tight">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 gap-6">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
              style={{ background: pillBg, border: `1px solid ${pillBorder}`, color: pillTextColor }}
            >
              Capabilities
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Everything you need,{' '}
              <span className="gradient-text">in one agent</span>
            </h2>
          </div>
          <p className="text-lg max-w-xs lg:text-right leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
            AIVA understands intent. Just talk — it handles the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass-card p-7 group cursor-pointer relative overflow-hidden"
            >
              <div
                className="absolute top-4 right-5 text-6xl font-black leading-none pointer-events-none select-none transition-all duration-500 group-hover:scale-110 group-hover:opacity-60"
                style={{ color: `${f.color}0e`, fontVariantNumeric: 'tabular-nums' }}
              >
                {f.num}
              </div>
              <div className="relative z-10">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
                  style={{ background: `${f.color}18`, boxShadow: `0 0 22px ${f.glow}` }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-black mb-2 tracking-tight">{f.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── AI Models ── */}
      <section id="ai-models" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase"
            style={{ background: pillBg, border: `1px solid ${pillBorder}`, color: pillTextColor }}
          >
            Your choice
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
            Choose your <span className="gradient-text">AI brain</span>
          </h2>
          <p className="text-lg max-w-sm mx-auto" style={{ color: 'rgb(var(--text-secondary))' }}>
            Switch between providers without losing your data or context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {MODELS.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="glass-card p-7 group"
            >
              <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">{m.icon}</div>
              <div className="text-lg font-black mb-1 tracking-tight">{m.name}</div>
              <div className="text-sm font-semibold mb-5" style={{ color: m.color }}>{m.provider}</div>
              <div className="space-y-2.5">
                {m.features.map(feat => (
                  <div key={feat} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                    <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 lg:px-20 py-24 text-center">
        <div className="glass-card p-16 relative overflow-hidden">
          <div className="orb w-[400px] h-[400px] bg-teal-500/20 top-[-150px] left-[-100px]" />
          <div className="orb w-[300px] h-[300px] bg-cyan-600/15 bottom-[-100px] right-[-80px]" />
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-black mb-5 tracking-tight leading-tight">
              Ready to be more{' '}
              <span className="gradient-text">productive?</span>
            </h2>
            <p className="text-xl mb-10 max-w-md mx-auto leading-relaxed font-light" style={{ color: 'rgb(var(--text-secondary))' }}>
              Join the future of personal productivity. Free to start — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/auth/login" className="btn-primary text-lg px-10 py-4">
                <Sparkles className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2 text-sm" style={{ color: statLabelColor }}>
                <span className="w-1 h-1 rounded-full" style={{ background: statLabelColor }} />
                No credit card
                <span className="w-1 h-1 rounded-full" style={{ background: statLabelColor }} />
                Instant access
                <span className="w-1 h-1 rounded-full" style={{ background: statLabelColor }} />
                Free forever tier
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 lg:px-20 py-10" style={{ borderTop: '1px solid rgba(var(--border), 0.08)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}>
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              AIVA AI · Built by{' '}
              <a href="https://aivafreelancia.com" className="text-teal-500 hover:text-teal-400 transition-colors">
                AIVA Freelancia
              </a>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: statLabelColor }}>
            <span>© 2026 AIVA Freelancia</span>
            <a href="#" className="hover:text-[rgb(var(--text-primary))] transition-colors duration-200">Privacy</a>
            <a href="#" className="hover:text-[rgb(var(--text-primary))] transition-colors duration-200">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
