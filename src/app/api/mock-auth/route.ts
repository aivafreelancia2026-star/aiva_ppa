import { NextRequest, NextResponse } from 'next/server'
import { readDb, writeDb } from '@/lib/supabase/mockDb'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name } = await req.json()
    const db = readDb()
    const cookieStore = await cookies()

    if (action === 'signup') {
      let user = db.users.find(u => u.email === email)
      if (!user) {
        user = {
          id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
          email,
          name: name || email.split('@')[0],
          preferred_model: 'gpt-4o-mini',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        db.users.push(user)
        writeDb(db)
      }
      cookieStore.set('sb-mock-session', user.id, { path: '/', httpOnly: false })
      return NextResponse.json({
        data: { user, session: { access_token: 'mock-token', user } },
        error: null
      })
    }

    if (action === 'signin') {
      let user = db.users.find(u => u.email === email)
      if (!user) {
        // Auto-signup to make testing extremely easy!
        user = {
          id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
          email,
          name: email.split('@')[0],
          preferred_model: 'gpt-4o-mini',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        db.users.push(user)
        writeDb(db)
      }
      cookieStore.set('sb-mock-session', user.id, { path: '/', httpOnly: false })
      return NextResponse.json({
        data: { user, session: { access_token: 'mock-token', user } },
        error: null
      })
    }

    if (action === 'signout') {
      cookieStore.delete('sb-mock-session')
      return NextResponse.json({ error: null })
    }

    if (action === 'getuser') {
      const mockSession = cookieStore.get('sb-mock-session')
      if (!mockSession) {
        return NextResponse.json({ data: { user: null }, error: null })
      }
      const user = db.users.find(u => u.id === mockSession.value)
      if (!user) {
        return NextResponse.json({ data: { user: null }, error: null })
      }
      return NextResponse.json({ data: { user }, error: null })
    }

    return NextResponse.json({ error: { message: 'Invalid auth action' } }, { status: 400 })
  } catch (err: any) {
    console.error('MOCK AUTH ERROR:', err)
    return NextResponse.json({ data: null, error: { message: err.message } }, { status: 500 })
  }
}
