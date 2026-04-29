import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}