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
      icon: () => (
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
