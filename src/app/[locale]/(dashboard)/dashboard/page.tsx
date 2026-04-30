'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { DS } from '@/components/prototype/design-system';
import { type Jam } from '@/components/prototype/mock-data';
import useUser from '@/hooks/useUser';
import { Card, GeoBg, ProgressBar, TrustGauge } from '@/components/prototype/ui-library';

type Locale = 'ar' | 'en';
type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

type ProfileStatsResponse = {
  wallet: {
    balance: number;
    currency: string;
    monthly_delta: number;
  };
  trust: {
    score: number;
    tier: Tier;
    next_tier_at: number | null;
    points_to_next_tier: number;
  };
  circles: {
    active_count: number;
    completed_count: number;
    defaulted_count: number;
    monthly_obligation: number;
  };
  savings: {
    total_contributed_lifetime: number;
    total_received_lifetime: number;
    net_lifetime: number;
  };
  next_payout: null | {
    jam3iyya_id: string;
    jam3iyya_name: string;
    expected_pot: number;
    expected_date: string;
    months_remaining: number;
  };
  next_payment_due: null | {
    jam3iyya_id: string;
    jam3iyya_name: string;
    amount: number;
    due_date: string;
    days_until_due: number;
  };
};

type Jam3iyyaApiRow = {
  id: string;
  name: string;
  description: string | null;
  type: 'private' | 'semi_public' | 'public';
  monthly_amount: number;
  total_members: number;
  duration_months: number;
  status: 'recruiting' | 'active' | 'completed' | 'cancelled';
  min_trust_score: number;
  insurance_pool: number;
  current_members_count?: number;
  current_month?: number;
};

const TIER_STYLES: Record<Tier, { color: string; bg: string }> = {
  bronze: { color: '#B87333', bg: '#FAEEE3' },
  silver: { color: '#9EA3A8', bg: '#F0F1F2' },
  gold: { color: '#C4963E', bg: '#FBF4E0' },
  platinum: { color: '#8B7CB6', bg: '#F0EDF8' },
};

const THEME_MAP = {
  wedding: { bg: '#FFF0F5', icon: '◇', color: '#D06080' },
  business: { bg: '#EFF5FF', icon: '◈', color: '#3060B0' },
  hajj: { bg: '#F5F0FF', icon: '◉', color: '#7060C0' },
  home: { bg: '#F0FFF5', icon: '▣', color: '#308060' },
  eid: { bg: '#FFFBF0', icon: '✦', color: '#C08030' },
};

type DashboardStrings = {
  dashboardTitle: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  trustScore: string;
  bronze: string;
  silver: string;
  gold: string;
  platinum: string;
  totalSaved: string;
  activeCircles: string;
  monthsToNextTurn: string;
  wallet: string;
  balance: string;
  walletIncreaseThisMonth: string;
  myCircles: string;
  viewAll: string;
  upcomingPayments: string;
  weddingFund: string;
  businessCapital: string;
  dueMay1: string;
  jod: string;
  monthly: string;
  month: string;
  months: string;
  members: string;
  of: string;
  seePayoutDay: string;
  previewPayoutExperience: string;
  home: string;
  market: string;
  circles: string;
  payout: string;
  englishShort: string;
  arabicShort: string;
  pointsToReachGold: string;
};

function TierBadge({ score, lang, labels }: Readonly<{ score: number; lang: Locale; labels: DashboardStrings }>) {
  const tier = DS.getTier(score);
  const tierStyle = TIER_STYLES[tier];
  const label = tier === 'bronze' ? labels.bronze : tier === 'silver' ? labels.silver : tier === 'gold' ? labels.gold : labels.platinum;

  return (
    <span
      style={{
        background: tierStyle.bg,
        color: tierStyle.color,
        border: `1px solid ${tierStyle.color}40`,
        borderRadius: 999,
        padding: '4px 14px',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function CircleCard({
  jam,
  lang,
  labels,
  onClick,
}: Readonly<{
  jam: Jam;
  lang: Locale;
  labels: DashboardStrings;
  onClick: () => void;
}>) {
  const theme = THEME_MAP[jam.theme as keyof typeof THEME_MAP] || {
    bg: DS.colors.card,
    icon: '◎',
    color: DS.colors.navy,
  };
  const tier = DS.getTier(jam.minScore || 0);
  const tierColor = TIER_STYLES[tier].color;
  const isRtl = lang === 'ar';

  return (
    <Card
      hover
      onClick={onClick}
      style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [isRtl ? 'right' : 'left']: 0,
          width: 3.5,
          background: tierColor,
          borderRadius: isRtl ? '0 4px 4px 0' : '4px 0 0 4px',
        }}
      />
      <div style={{ paddingInlineStart: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: theme.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: theme.color,
              }}
            >
              {theme.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: DS.colors.navy }}>
                {isRtl ? jam.nameAr : jam.nameEn}
              </div>
              <div style={{ fontSize: 12, color: DS.colors.muted, marginTop: 2 }}>
                {jam.totalMembers} {labels.members} · {jam.duration} {jam.duration === 1 ? labels.month : labels.months}
              </div>
            </div>
          </div>
          <div style={{ textAlign: isRtl ? 'start' : 'end', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: DS.colors.navy, lineHeight: 1 }}>{jam.amount}</div>
            <div style={{ fontSize: 11, color: DS.colors.muted }}>
              {labels.jod}
              {labels.monthly}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <TierBadge score={jam.minScore || 0} lang={lang} labels={labels} />
          </div>
        </div>
        {jam.status === 'active' && jam.currentMonth > 0 && (
          <div style={{ marginTop: 12 }}>
            <ProgressBar value={jam.currentMonth} max={jam.duration} color={tierColor} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: DS.colors.muted }}>
              <span>{`${labels.month} ${jam.currentMonth}`}</span>
              <span>{`${labels.of} ${jam.duration}`}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function mapCircle(row: Jam3iyyaApiRow): Jam {
  const theme = row.type === 'public' ? 'business' : row.type === 'semi_public' ? 'home' : 'wedding';
  const currentMembers = row.current_members_count ?? 0;

  return {
    id: row.id,
    nameAr: row.name,
    nameEn: row.name,
    amount: row.monthly_amount,
    totalMembers: row.total_members,
    duration: row.duration_months,
    minScore: row.min_trust_score,
    type: row.type,
    theme,
    currentMonth: row.current_month ?? Math.min(currentMembers, row.duration_months),
    yourTurn: 1,
    status: row.status,
    avgScore: row.min_trust_score,
    organizerAr: row.name,
    organizerEn: row.name,
    descriptionAr: row.description || '',
    descriptionEn: row.description || '',
    insuranceFund: row.insurance_pool,
    totalPot: row.monthly_amount * row.total_members,
    members: [],
    slots: Math.max(0, row.total_members - currentMembers),
  };
}

function DashboardTopBar({
  locale,
  labels,
  onSwitchLocale,
}: Readonly<{
  locale: Locale;
  labels: DashboardStrings;
  onSwitchLocale: () => void;
}>) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '13px 16px',
        background: DS.colors.card,
        borderBottom: `1px solid ${DS.colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <span style={{ fontWeight: 800, fontSize: 17, color: DS.colors.navy }}>{labels.dashboardTitle}</span>
      <button
        onClick={onSwitchLocale}
        style={{
          background: DS.colors.mutedLight,
          border: 'none',
          borderRadius: 8,
          padding: '5px 11px',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          color: DS.colors.navy,
          fontFamily: 'inherit',
        }}
      >
        {locale === 'ar' ? labels.englishShort : labels.arabicShort}
      </button>
    </div>
  );
}

export default function DashboardPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('dashboard');
  const router = useRouter();
  const isRtl = locale === 'ar';
  const isDev = process.env.NODE_ENV !== 'production';
  const [stats, setStats] = useState<ProfileStatsResponse | null>(null);
  const [activeCircles, setActiveCircles] = useState<Jam[]>([]);
  const [loading, setLoading] = useState(true);

  const { profile: userProfile, loading: userLoading } = useUser();
  const showLoading = loading || userLoading;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, circlesResponse] = await Promise.all([
          fetch('/api/profile/stats'),
          fetch('/api/jam3iyyas/my'),
        ]);

        if (statsResponse.status === 401 || circlesResponse.status === 401) {
          if (!isDev) {
          router.push(`/${locale}/login`);
          }
          return;
        }

        if (statsResponse.ok) {
          const statsData = (await statsResponse.json()) as ProfileStatsResponse;
          setStats(statsData);
        }

        if (circlesResponse.ok) {
          const circlesData = (await circlesResponse.json()) as { jam3iyyas: Jam3iyyaApiRow[] };
          setActiveCircles((circlesData.jam3iyyas ?? []).map(mapCircle));
        }
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [isDev, locale, router]);

  const trustScore = userProfile?.trust_score ?? 0;
  const walletBalance = userProfile?.wallet_balance ?? 0;
  const fullName = userProfile?.full_name ?? '';

  const labels: DashboardStrings = {
    dashboardTitle: t('dashboardTitle'),
    goodMorning: t('goodMorning'),
    goodAfternoon: t('goodAfternoon'),
    goodEvening: t('goodEvening'),
    trustScore: t('trustScore'),
    bronze: t('bronze'),
    silver: t('silver'),
    gold: t('gold'),
    platinum: t('platinum'),
    totalSaved: t('totalSaved'),
    activeCircles: t('activeCircles'),
    monthsToNextTurn: t('monthsToNextTurn'),
    wallet: t('wallet'),
    balance: t('balance'),
    walletIncreaseThisMonth: t('walletIncreaseThisMonth'),
    myCircles: t('myCircles'),
    viewAll: t('viewAll'),
    upcomingPayments: t('upcomingPayments'),
    weddingFund: t('weddingFund'),
    businessCapital: t('businessCapital'),
    dueMay1: t('dueMay1'),
    jod: t('jod'),
    monthly: t('monthly'),
    month: t('month'),
    months: t('months'),
    members: t('members'),
    of: t('of'),
    seePayoutDay: t('seePayoutDay'),
    previewPayoutExperience: t('previewPayoutExperience'),
    home: t('home'),
    market: t('market'),
    circles: t('circles'),
    payout: t('payout'),
    englishShort: t('englishShort'),
    arabicShort: t('arabicShort'),
    pointsToReachGold: t('pointsToReachGold', { points: Math.max(0, (stats?.trust.next_tier_at ?? 600) - trustScore) }),
  };

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? labels.goodMorning : greetHour < 17 ? labels.goodAfternoon : labels.goodEvening;
  const tier = (userProfile?.tier as Tier) ?? DS.getTier(trustScore);
  const activeCircleCount = stats?.circles.active_count ?? activeCircles.length;
  const monthsToNextTurn = stats?.next_payout?.months_remaining ?? (activeCircles[0] ? Math.max(0, activeCircles[0].duration - activeCircles[0].currentMonth) : 0);

  const insights = isRtl
    ? [
        { icon: '↑', value: `${walletBalance.toLocaleString()} د.أ`, label: labels.totalSaved, color: DS.colors.success },
        { icon: '◎', value: `${activeCircleCount}`, label: labels.activeCircles, color: DS.colors.navy },
        { icon: '★', value: `${monthsToNextTurn}`, label: labels.monthsToNextTurn, color: DS.colors.gold },
      ]
    : [
        { icon: '↑', value: `${walletBalance.toLocaleString()} JOD`, label: labels.totalSaved, color: DS.colors.success },
        { icon: '◎', value: `${activeCircleCount}`, label: labels.activeCircles, color: DS.colors.navy },
        { icon: '★', value: `${monthsToNextTurn}`, label: labels.monthsToNextTurn, color: DS.colors.gold },
      ];

  const upcomingPayments = stats?.next_payment_due
    ? [
        {
          name: stats.next_payment_due.jam3iyya_name,
          amount: stats.next_payment_due.amount,
          due: `${stats.next_payment_due.due_date} · ${stats.next_payment_due.days_until_due}d`,
          color: DS.colors.gold,
        },
      ]
    : [
        { name: labels.weddingFund, amount: 200, due: labels.dueMay1, color: DS.colors.gold },
        { name: labels.businessCapital, amount: 500, due: labels.dueMay1, color: DS.colors.navyMid },
      ];

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, paddingBottom: 90 }} data-screen-label="Dashboard">
      <DashboardTopBar locale={locale} labels={labels} onSwitchLocale={() => router.push(`/${isRtl ? 'en' : 'ar'}/dashboard`)} />

      <div style={{ padding: '20px 16px', maxWidth: 520, margin: '0 auto' }}>
        {showLoading ? <div style={{ fontSize: 12, color: DS.colors.muted, marginBottom: 12 }}>{isRtl ? 'جاري تحميل البيانات...' : 'Loading live data...'}</div> : null}
        <Card style={{ padding: 20, marginBottom: 16, overflow: 'hidden', position: 'relative', background: DS.colors.navy }}>
          <GeoBg opacity={0.06} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>{greeting}</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
                {fullName ? fullName.split(' ')[0] : ''} 👋
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{labels.trustScore}</span>
                <TierBadge score={trustScore} lang={locale} labels={labels} />
              </div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{trustScore}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>/ 1000</div>
            </div>
            <TrustGauge score={trustScore} size={110} animated={false} showLabel={false} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              <span>{labels.bronze}</span>
              <span style={{ color: TIER_STYLES[tier].color, fontWeight: 700 }}>
                {tier === 'bronze' ? labels.bronze : tier === 'silver' ? labels.silver : tier === 'gold' ? labels.gold : labels.platinum} · {trustScore}/1000
              </span>
              <span>{labels.platinum}</span>
            </div>
            <ProgressBar value={trustScore} max={1000} color={TIER_STYLES[tier].color} height={5} />
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{labels.pointsToReachGold}</div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {insights.map((ins) => (
            <Card key={ins.label} style={{ padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, color: ins.color, marginBottom: 4 }}>{ins.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: DS.colors.navy, lineHeight: 1 }}>{ins.value}</div>
              <div style={{ fontSize: 10, color: DS.colors.muted, marginTop: 3, lineHeight: 1.3 }}>{ins.label}</div>
            </Card>
          ))}
        </div>

        <Card style={{ padding: 18, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: DS.colors.muted, marginBottom: 4 }}>
              {labels.wallet} · {labels.balance}
            </div>
            <div style={{ fontWeight: 900, fontSize: 28, color: DS.colors.navy, letterSpacing: '-0.02em' }}>
              {walletBalance.toLocaleString()}
              <span style={{ fontSize: 14, fontWeight: 600, color: DS.colors.muted, marginInlineStart: 4 }}>{labels.jod}</span>
            </div>
            <div style={{ fontSize: 12, color: DS.colors.success, marginTop: 4 }}>{labels.walletIncreaseThisMonth}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.goldBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.colors.gold, fontSize: 18 }}
            >
              +
            </button>
            <button
              style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.mutedLight, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.colors.muted, fontSize: 18 }}
            >
              ↓
            </button>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>{labels.myCircles}</span>
          <button
            onClick={() => router.push(`/${locale}/jam3iyyas/browse`)}
            style={{ background: 'none', border: 'none', color: DS.colors.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {labels.viewAll}
          </button>
        </div>

        {activeCircles.map((jam) => (
          <CircleCard
            key={jam.id}
            jam={jam}
            lang={locale}
            labels={labels}
            onClick={() => router.push(`/${locale}/jam3iyyas/${jam.id}`)}
          />
        ))}

        <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy, marginBottom: 12, marginTop: 8 }}>
          {labels.upcomingPayments}
        </div>
        {upcomingPayments.map((payment) => (
          <Card
            key={payment.name}
            style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: payment.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: DS.colors.navy }}>{payment.name}</div>
                <div style={{ fontSize: 12, color: DS.colors.muted }}>{payment.due}</div>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>
              {payment.amount} <span style={{ fontSize: 11, color: DS.colors.muted }}>{labels.jod}</span>
            </div>
          </Card>
        ))}

        <Card
          hover
          onClick={() => router.push(`/${locale}/payout`)}
          style={{ padding: 18, marginTop: 8, background: `linear-gradient(135deg, ${DS.colors.goldBg}, #fff)`, border: `1.5px solid ${DS.colors.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: DS.colors.navy, marginBottom: 4 }}>{labels.seePayoutDay}</div>
            <div style={{ fontSize: 12, color: DS.colors.muted }}>
              {stats?.next_payout
                ? `${stats.next_payout.jam3iyya_name} · ${stats.next_payout.expected_date}`
                : labels.previewPayoutExperience}
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
              <polyline points={isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
            </svg>
          </div>
        </Card>
      </div>

    </div>
  );
}