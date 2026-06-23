import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fcm_token } = await req.json()
  if (!fcm_token) return NextResponse.json({ error: 'Missing fcm_token' }, { status: 400 })

  const { error } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email!, fcm_token, name: user.user_metadata?.full_name ?? user.email })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
