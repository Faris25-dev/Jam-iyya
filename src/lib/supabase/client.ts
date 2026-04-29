import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// My code alias
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a browser-side Supabase client (singleton via createBrowserClient).
 * Safe to call in Client Components.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}