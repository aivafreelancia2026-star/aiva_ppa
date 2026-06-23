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
  themeColor: '#0f0f1a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <PwaRegister />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#f8fafc',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#8b5cf6', secondary: '#0f0f1a' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0f0f1a' } },
          }}
        />
      </body>
    </html>
  )
}
