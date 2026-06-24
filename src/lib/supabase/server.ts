import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockClient } from './mockClientWrapper'

export async function createClient() {
  const cookieStore = await cookies()
  const isDummy = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy-project')
  if (isDummy) {
    return createMockClient(cookieStore)
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createAdminClient() {
  const cookieStore = await cookies()
  const isDummy = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy-project')
  if (isDummy) {
    return createMockClient(cookieStore)
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}


