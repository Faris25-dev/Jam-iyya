'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AppButton, Card, TopBar } from '@/components/prototype/ui-library';
import { DS } from '@/components/prototype/design-system';

type Locale = 'ar' | 'en';

type WalletTransaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'payout' | 'contribution';
  title: string;
  subtitle: string;
  amount: number;
  time: string;
  color: string;
  bg: string;
};

type WalletSummary = {
  balance: number;
  trust_score: number;
  stats: {
    total_deposits: number;
    total_withdrawals: number;
    total_contributions: number;
    total_payouts: number;
    total_insurance_received: number;
    net_change_30d: number;
  };
  currency: string;
};

type WalletTransactionsResponse = {
  transactions: Array<{
    id: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'payout' | 'contribution' | 'insurance_contribution' | 'insurance_payout';
    direction: 'incoming' | 'outgoing';
    description: string | null;
    created_at: string;
  }>;
};

const EMPTY_SUMMARY: WalletSummary = {
  balance: 0,
  trust_score: 0,
  stats: {
    total_deposits: 0,
    total_withdrawals: 0,
    total_contributions: 0,
    total_payouts: 0,
    total_insurance_received: 0,
    net_change_30d: 0,
  },
  currency: 'JOD',
};

const TRANSACTION_COLORS: Record<WalletTransaction['type'], { color: string; bg: string }> = {
  deposit: { color: DS.colors.success, bg: DS.colors.successLight },
  withdraw: { color: DS.colors.error, bg: DS.colors.errorLight },
  payout: { color: DS.colors.gold, bg: DS.colors.goldBg },
  contribution: { color: DS.colors.navy, bg: DS.colors.goldBg },
};

const normalizeTransactionType = (
  type: WalletTransactionsResponse['transactions'][number]['type']
): WalletTransaction['type'] => {
  if (type === 'withdrawal') return 'withdraw';
  if (type === 'insurance_contribution') return 'contribution';
  if (type === 'insurance_payout') return 'payout';
  return type;
};

export default function WalletPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('wallet');
  const router = useRouter();
  const isRtl = locale === 'ar';
  const isDev = process.env.NODE_ENV !== 'production';

  const [summary, setSummary] = useState<WalletSummary>(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<WalletTransactionsResponse['transactions']>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setErrorMessage(null);
        setLoading(true);

        const [walletResponse, transactionsResponse] = await Promise.all([
          fetch('/api/wallet'),
          fetch('/api/wallet/transactions?limit=20'),
        ]);

        if (walletResponse.status === 401 || transactionsResponse.status === 401) {
          if (!isDev) {
          router.push(`/${locale}/login`);
          }
          return;
        }

        if (!walletResponse.ok) {
          const walletError = await walletResponse.json();
          throw new Error(walletError?.error?.message?.[locale] ?? walletError?.error?.message?.en ?? 'Failed to load wallet');
        }

        const walletData = (await walletResponse.json()) as WalletSummary;
        setSummary(walletData);

        if (!transactionsResponse.ok) {
          const txError = await transactionsResponse.json();
          throw new Error(txError?.error?.message?.[locale] ?? txError?.error?.message?.en ?? 'Failed to load transactions');
        }

        const txData = (await transactionsResponse.json()) as WalletTransactionsResponse;
        setTransactions(txData.transactions);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load wallet');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    void loadWallet();
  }, [isDev, locale, router]);

  const refreshWallet = async () => {
    const [walletResponse, transactionsResponse] = await Promise.all([
      fetch('/api/wallet'),
      fetch('/api/wallet/transactions?limit=20'),
    ]);

    if (walletResponse.ok) {
      const walletData = (await walletResponse.json()) as WalletSummary;
      setSummary(walletData);
    }

    if (transactionsResponse.ok) {
      const txData = (await transactionsResponse.json()) as WalletTransactionsResponse;
      setTransactions(txData.transactions);
    }
  };

  const handleAction = async (type: 'deposit' | 'withdraw') => {
    const amountValue = window.prompt(type === 'deposit' ? t('deposit') : t('withdraw'));
    const amount = Number(amountValue);

    if (!amountValue || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setErrorMessage(payload?.error?.message?.[locale] ?? payload?.error?.message ?? t('walletTipBody'));
      return;
    }

    setErrorMessage(null);
    await refreshWallet();
  };

  const actionButtons = [
    { key: 'deposit' as const, label: t('deposit'), variant: 'gold' as const, icon: '+', onClick: () => void handleAction('deposit') },
    { key: 'withdraw' as const, label: t('withdraw'), variant: 'secondary' as const, icon: '↓', onClick: () => void handleAction('withdraw') },
  ];

  const displayTransactions: WalletTransaction[] = transactions.map((transaction) => {
    const normalizedType = normalizeTransactionType(transaction.type);
    const signedAmount = transaction.direction === 'outgoing'
      ? -Math.abs(transaction.amount)
      : Math.abs(transaction.amount);

    return {
      id: transaction.id,
      type: normalizedType,
      title: transaction.description || normalizedType,
      subtitle: transaction.direction === 'incoming' ? t('incoming') : t('outgoing'),
      amount: signedAmount,
      time: new Date(transaction.created_at).toLocaleString(),
      color: TRANSACTION_COLORS[normalizedType].color,
      bg: TRANSACTION_COLORS[normalizedType].bg,
    };
  });

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, paddingBottom: 90 }} data-screen-label="Wallet">
      <TopBar title={t('walletTitle')} onBack={() => router.push(`/${locale}/dashboard`)} lang={locale} setLang={(nextLocale) => router.push(`/${nextLocale}/wallet`)} />

      <div style={{ padding: '20px 16px', maxWidth: 520, margin: '0 auto' }}>
        {errorMessage ? <div style={{ background: DS.colors.errorLight, color: DS.colors.error, borderRadius: DS.radii.md, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>{errorMessage}</div> : null}

        <Card style={{ padding: 20, marginBottom: 16, overflow: 'hidden', position: 'relative', background: DS.colors.navy }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(196,150,62,0.25), transparent 34%), radial-gradient(circle at bottom left, rgba(255,255,255,0.06), transparent 28%)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 6 }}>{t('availableBalance')}</div>
              <div style={{ color: '#fff', fontSize: 34, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {loading ? '...' : summary.balance.toLocaleString()}
                <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginInlineStart: 6 }}>{t('jod')}</span>
              </div>
              <div style={{ color: DS.colors.gold, fontSize: 12, fontWeight: 700, marginTop: 10 }}>{t('walletIncreaseThisMonth')}</div>
            </div>
            <div style={{ width: 78, height: 78, borderRadius: 24, background: 'rgba(196,150,62,0.18)', border: `1px solid ${DS.colors.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, flexShrink: 0 }}>
              ◈
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {actionButtons.map((button) => (
            <AppButton
              key={button.key}
              variant={button.variant}
              size="lg"
              onClick={button.onClick}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{button.icon}</span>
              {button.label}
            </AppButton>
          ))}
        </div>

        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>{t('walletSummary')}</div>
            <span style={{ fontSize: 11, color: DS.colors.muted, fontWeight: 700 }}>{t('live')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: t('deposits'), value: `+${summary.stats.total_deposits.toLocaleString()} ${t('jod')}`, color: DS.colors.success },
              { label: t('payouts'), value: `+${summary.stats.total_payouts.toLocaleString()} ${t('jod')}`, color: DS.colors.gold },
              { label: t('withdrawals'), value: `-${summary.stats.total_withdrawals.toLocaleString()} ${t('jod')}`, color: DS.colors.error },
            ].map((item) => (
              <div key={item.label} style={{ background: DS.colors.bg, borderRadius: DS.radii.md, padding: 12, border: `1px solid ${DS.colors.border}` }}>
                <div style={{ fontSize: 11, color: DS.colors.muted, marginBottom: 5 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>{t('transactionHistory')}</span>
          <span style={{ fontSize: 12, color: DS.colors.muted }}>{t('recentActivity')}</span>
        </div>

        {displayTransactions.map((transaction) => {
          const amountLabel = `${transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()} ${t('jod')}`;
          return (
            <Card key={transaction.id} style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: transaction.bg, color: transaction.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                  {transaction.type === 'withdraw' ? '↓' : transaction.type === 'deposit' ? '+' : transaction.type === 'payout' ? '◈' : '◎'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {transaction.title}
                  </div>
                  <div style={{ fontSize: 12, color: DS.colors.muted, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {transaction.subtitle}
                  </div>
                  <div style={{ fontSize: 11, color: DS.colors.muted, marginTop: 4 }}>{transaction.time}</div>
                </div>
              </div>
              <div style={{ textAlign: 'end', flexShrink: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: transaction.amount > 0 ? transaction.color : DS.colors.navy }}>{amountLabel}</div>
                <div style={{ fontSize: 11, color: transaction.amount > 0 ? transaction.color : DS.colors.muted, fontWeight: 700, marginTop: 2 }}>
                  {transaction.amount > 0 ? t('incoming') : t('outgoing')}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ position: 'fixed', left: 16, right: 16, bottom: 104, maxWidth: 520, margin: '0 auto', pointerEvents: 'none' }}>
        <Card style={{ padding: 14, background: `linear-gradient(135deg, ${DS.colors.goldBg}, #fff)`, border: `1px solid ${DS.colors.gold}35` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: DS.colors.navy, marginBottom: 4 }}>{t('walletTipTitle')}</div>
              <div style={{ fontSize: 12, color: DS.colors.muted, lineHeight: 1.5 }}>{t('walletTipBody')}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>↗</div>
          </div>
        </Card>
      </div>
    </div>
  );
}