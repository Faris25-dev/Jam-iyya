import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { defaultLocale, locales } from './src/i18n/config';

const intlMiddleware = createIntlMiddleware({
  defaultLocale,
  locales,
  localePrefix: 'always',
});

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

const PROTECTED_SECTIONS = new Set([
  'dashboard',
  'jam3iyyas',
  'payout',
  'settings',
  'trust-score',
  'wallet',
]);

const AUTH_SECTIONS = new Set(['login', 'signup', 'verify']);

function getPathLocale(pathname: string) {
  const segment = pathname.split('/')[1];
  return locales.includes(segment as (typeof locales)[number]) ? segment : defaultLocale;
}

function isProtectedPath(pathname: string) {
  const [, maybeLocale, section] = pathname.split('/');

  if (!locales.includes(maybeLocale as (typeof locales)[number])) {
    return false;
  }

  return PROTECTED_SECTIONS.has(section) && !AUTH_SECTIONS.has(section);
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user = null;
  let cookiesToSet: CookieToSet[] = [];

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookies: CookieToSet[]) {
          cookiesToSet = nextCookies;
          nextCookies.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    });

    const result = await supabase.auth.getUser();
    user = result.data.user;
  }

  let response: NextResponse;

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const locale = getPathLocale(request.nextUrl.pathname);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    response = NextResponse.redirect(loginUrl);
  } else {
    response = intlMiddleware(request);
  }

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
