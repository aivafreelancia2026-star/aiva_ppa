import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Firebase Admin is initialized lazily to avoid cold-start issues
async function getFirebaseAdmin() {
  const { default: admin } = await import('firebase-admin')
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return admin
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, url, userId } = await req.json()

  // Get FCM token for the target user
  const targetId = userId ?? user.id
  const { data: profile } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', targetId)
    .single()

  if (!profile?.fcm_token) {
    return NextResponse.json({ error: 'No FCM token registered for user' }, { status: 400 })
  }

  try {
    const admin = await getFirebaseAdmin()
    const message = {
      token: profile.fcm_token,
      notification: { title, body },
      data: url ? { url } : {},
      webpush: {
        fcmOptions: { link: url ?? '/dashboard' },
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        },
      },
      android: {
        notification: {
          title,
          body,
          icon: 'ic_notification',
          color: '#7c3aed',
          sound: 'default',
        },
      },
    }

    const result = await admin.messaging().send(message)
    return NextResponse.json({ success: true, messageId: result })
  } catch (err) {
    console.error('FCM send error:', err)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
