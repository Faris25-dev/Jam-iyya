import {
  createBrowserClient,
  createServerClient as createSSRServerClient,
  type CookieOptions,
} from '@supabase/ssr'
import { cookies } from 'next/headers'

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

/**
 * Creates a server-side Supabase client that reads and writes cookies via
 * Next.js `cookies()` from `next/headers`.
 * Use in Server Components, Server Actions, and Route Handlers.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll may be called from a Server Component where cookies cannot
          // be written. The middleware is responsible for refreshing the session
          // and writing the updated cookie on every request.
        }
      },
    },
  })
}