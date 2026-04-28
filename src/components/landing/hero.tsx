import Link from 'next/link';

export function Hero() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Jam&apos;iyya AI</p>
        <h1 className="text-5xl font-bold tracking-tight text-balance sm:text-6xl">Trust infrastructure for the savings circles people already use.</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          Combine AI trust scoring, escrow-style wallets, and shared insurance to make jam&apos;iyyas safer and easier to manage.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground" href="/ar/dashboard">
            Start now
          </Link>
          <Link className="rounded-full border border-border px-6 py-3 text-sm font-semibold" href="/ar/jam3iyyas/browse">
            Browse circles
          </Link>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Trust score snapshot</p>
          <p className="text-5xl font-black">842</p>
          <p className="text-sm text-muted-foreground">Platinum tier, on-time payments, verified ID, and strong group history.</p>
        </div>
      </div>
    </section>
  );
}