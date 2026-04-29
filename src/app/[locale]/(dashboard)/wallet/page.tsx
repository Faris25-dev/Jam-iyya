'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AppButton, Card, TopBar } from '@/components/prototype/ui-library';
import { DS } from '@/components/prototype/design-system';
import { MOCK_USER } from '@/components/prototype/mock-data';

type Locale = 'ar' | 'en';

type WalletTransaction = {
  id: number;
  type: 'deposit' | 'withdraw' | 'payout' | 'contribution';
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  amount: number;
  time: string;
  color: string;
  bg: string;
};

const TRANSACTIONS: WalletTransaction[] = [
  {
    id: 1,
    type: 'deposit',
    titleAr: 'إيداع عبر التحويل البنكي',
    titleEn: 'Bank transfer deposit',
    subtitleAr: 'تمت إضافة الرصيد إلى المحفظة',
    subtitleEn: 'Funds added to wallet',
    amount: 500,
    time: 'Today · 09:30',
    color: DS.colors.success,
    bg: DS.colors.successLight,
  },
  {
    id: 2,
    type: 'contribution',
    titleAr: 'مساهمة جمعية الزفاف',
    titleEn: 'Wedding Fund contribution',
    subtitleAr: 'دفعة شهرية للقسم النشط',
    subtitleEn: 'Monthly contribution for active circle',
    amount: -200,
    time: 'Yesterday · 18:10',
    color: DS.colors.navy,
    bg: DS.colors.goldBg,
  },
  {
    id: 3,
    type: 'payout',
    titleAr: 'استلام دور الجمعية',
    titleEn: 'Circle payout received',
    subtitleAr: 'دفعة دخلت إلى الرصيد المتاح',
    subtitleEn: 'Payout credited to available balance',
    amount: 2400,
    time: 'Apr 24 · 14:45',
    color: DS.colors.gold,
    bg: DS.colors.goldBg,
  },
  {
    id: 4,
    type: 'withdraw',
    titleAr: 'سحب إلى البطاقة',
    titleEn: 'Cash out to card',
    subtitleAr: 'تم تحويل جزء من الرصيد إلى البطاقة',
    subtitleEn: 'Part of the balance was moved to card',
    amount: -300,
    time: 'Apr 20 · 11:15',
    color: DS.colors.error,
    bg: DS.colors.errorLight,
  },
];

export default function WalletPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('wallet');
  const router = useRouter();
  const isRtl = locale === 'ar';

  const user = MOCK_USER;
  const walletBalance = user.walletBalance;

  // TODO: wallet balance, deposit, withdraw, and transaction history will come from Person 2's wallet API.
  const actionButtons = [
    { key: 'deposit' as const, label: t('deposit'), variant: 'gold' as const, icon: '+' },
    { key: 'withdraw' as const, label: t('withdraw'), variant: 'secondary' as const, icon: '↓' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, paddingBottom: 90 }} data-screen-label="Wallet">
      <TopBar title={t('walletTitle')} onBack={() => router.push(`/${locale}/dashboard`)} lang={locale} setLang={(nextLocale) => router.push(`/${nextLocale}/wallet`)} />

      <div style={{ padding: '20px 16px', maxWidth: 520, margin: '0 auto' }}>
        <Card style={{ padding: 20, marginBottom: 16, overflow: 'hidden', position: 'relative', background: DS.colors.navy }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(196,150,62,0.25), transparent 34%), radial-gradient(circle at bottom left, rgba(255,255,255,0.06), transparent 28%)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 6 }}>{t('availableBalance')}</div>
              <div style={{ color: '#fff', fontSize: 34, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {walletBalance.toLocaleString()}
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
              onClick={() => {}}
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
              { label: t('deposits'), value: `+500 ${t('jod')}`, color: DS.colors.success },
              { label: t('payouts'), value: `+2,400 ${t('jod')}`, color: DS.colors.gold },
              { label: t('withdrawals'), value: `-300 ${t('jod')}`, color: DS.colors.error },
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

        {TRANSACTIONS.map((transaction) => {
          const amountLabel = `${transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()} ${t('jod')}`;
          return (
            <Card key={transaction.id} style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: transaction.bg, color: transaction.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                  {transaction.type === 'withdraw' ? '↓' : transaction.type === 'deposit' ? '+' : transaction.type === 'payout' ? '◈' : '◎'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isRtl ? transaction.titleAr : transaction.titleEn}
                  </div>
                  <div style={{ fontSize: 12, color: DS.colors.muted, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isRtl ? transaction.subtitleAr : transaction.subtitleEn}
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