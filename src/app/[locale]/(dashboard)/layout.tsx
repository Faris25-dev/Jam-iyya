'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { DS } from '@/components/prototype/design-system';

type Locale = 'ar' | 'en';

function DashboardNavBar({ locale, pathname }: Readonly<{ locale: Locale; pathname: string }>) {
  const isActive = (segment: string) => pathname.includes(`/${locale}/${segment}`);

  const items = [
    {
      href: `/${locale}/dashboard`,
      label: locale === 'ar' ? 'الرئيسية' : 'Home',
      active: isActive('dashboard'),
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? DS.colors.navy : 'none'} stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: `/${locale}/jam3iyyas/browse`,
      label: locale === 'ar' ? 'السوق' : 'Market',
      active: isActive('jam3iyyas/browse'),
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      href: `/${locale}/jam3iyyas/create`,
      label: '',
      active: isActive('jam3iyyas/create'),
      icon: (active: boolean) => (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      special: true,
    },
    {
      href: `/${locale}/trust-score`,
      label: locale === 'ar' ? 'الثقة' : 'Trust',
      active: isActive('trust-score'),
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      href: `/${locale}/wallet`,
      label: locale === 'ar' ? 'الصرف' : 'Wallet',
      active: isActive('wallet'),
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.gold : DS.colors.muted} strokeWidth={2}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      href: `/${locale}/settings`,
      label: locale === 'ar' ? 'الإعدادات' : 'Settings',
      active: isActive('settings'),
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .6 1.7 1.7 0 00-.4 1.1V21a2 2 0 01-4 0v-.09A1.7 1.7 0 008.6 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-.6-1 1.7 1.7 0 00-1.1-.4H3a2 2 0 010-4h.09A1.7 1.7 0 004.6 8.6a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 012.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-.6 1.7 1.7 0 00.4-1.1V3a2 2 0 014 0v.09A1.7 1.7 0 0015.4 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 012.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.2.38.52.7.9.9.34.18.72.3 1.1.3H21a2 2 0 010 4h-.09a1.7 1.7 0 00-1.51.8z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: DS.colors.card,
        borderTop: `1px solid ${DS.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 0 18px',
        boxShadow: '0 -4px 24px rgba(13,31,60,0.08)',
      }}
    >
      {items.map((item) => {
        if (item.special) {
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: DS.colors.navy,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: DS.shadow.md,
                transform: 'translateY(-8px)',
              }}
            >
              {item.icon(true)}
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: item.active ? DS.colors.navy : DS.colors.muted,
              fontFamily: 'inherit',
              fontSize: 10,
              fontWeight: item.active ? 700 : 400,
              padding: '4px 8px',
              minWidth: 50,
            }}
          >
            {item.icon(item.active)}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: { locale: string };
}>) {
  const pathname = usePathname();
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const showNav = !pathname.includes('/payout') && !pathname.includes('/jam3iyyas/create');

  return (
    <div style={{ minHeight: '100vh', paddingBottom: showNav ? 90 : 0 }}>
      {children}
      {showNav ? <DashboardNavBar locale={locale} pathname={pathname} /> : null}
    </div>
  );
}
