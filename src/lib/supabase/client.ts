import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from './mockClientWrapper'

export function createClient() {
  const isDummy = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy-project')
  if (isDummy) {
    return createMockClient()
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )
}

