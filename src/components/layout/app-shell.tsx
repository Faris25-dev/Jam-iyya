import Link from 'next/link';

import { APP_NAME } from '@/lib/constants';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/ar" className="text-lg font-bold tracking-tight">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/ar/dashboard">Dashboard</Link>
            <Link href="/ar/jam3iyyas/browse">Jam3iyyas</Link>
            <Link href="/ar/wallet">Wallet</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}