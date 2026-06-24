import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { PwaRegister } from '@/components/PwaRegister'

export const metadata: Metadata = {
  title: { default: 'AIVA AI – Agentic Productivity Assistant', template: '%s | AIVA AI' },
  description: 'Your intelligent AI-powered productivity assistant. Manage tasks, reminders, shopping lists, and counters with natural language.',
  keywords: ['AI assistant', 'productivity', 'task manager', 'reminder', 'AIVA', 'AIVA Freelancia'],
  authors: [{ name: 'AIVA Freelancia', url: 'https://aivafreelancia.com' }],
  creator: 'AIVA Freelancia',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'AIVA AI',
    title: 'AIVA AI – Agentic Productivity Assistant',
    description: 'Manage your life with natural language. Talk to AIVA.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#07070f' },
    { media: '(prefers-color-scheme: light)', color: '#faf8f3' },
  ],
  width: 'device-width',
  initialScale: 1,
}

// Inline script runs synchronously before React hydrates — prevents flash
const themeScript = `(function(){try{var t=localStorage.getItem('aiva-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <PwaRegister />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--bg-secondary))',
              color: 'rgb(var(--text-primary))',
              border: '1px solid rgba(var(--border), var(--border-opacity))',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#14b8a6', secondary: 'transparent' } },
            error: { iconTheme: { primary: '#f87171', secondary: 'transparent' } },
          }}
        />
      </body>
    </html>
  )
}
