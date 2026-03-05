import { createClient } from '@supabase/supabase-js'

// Server-side client with secret key (bypasses RLS)
// Instantiated lazily so build-time page collection doesn't fail without env vars.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
    process.env.SUPABASE_SECRET_KEY ?? 'placeholder'
  )
}

// Browser-safe publishable client
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder'
  )
}
