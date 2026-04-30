'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { DS, THEME_MAP } from '@/components/prototype/design-system';
import { MOCK_USER, type Jam } from '@/components/prototype/mock-data';
import { AppButton, Card, GeoBg, ProgressBar } from '@/components/prototype/ui-library';

type Locale = 'ar' | 'en';
type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';
type BrowseJam = Jam & { uuid: string };

const TIER_STYLES: Record<Tier, { color: string; bg: string }> = {
  bronze: { color: '#B87333', bg: '#FAEEE3' },
  silver: { color: '#9EA3A8', bg: '#F0F1F2' },
  gold: { color: '#C4963E', bg: '#FBF4E0' },
  platinum: { color: '#8B7CB6', bg: '#F0EDF8' },
};

type MarketplaceStrings = {
  marketplaceTitle: string;
  englishShort: string;
  arabicShort: string;
  searchPlaceholder: string;
  allTiers: string;
  bronze: string;
  silver: string;
  gold: string;
  platinum: string;
  allAmounts: string;
  under200: string;
  between200And500: string;
  over500: string;
  smartMatch: string;
  suggestedForProfile: string;
  circlesAvailable: string;
  noMatchingCircles: string;
  amount: string;
  duration: string;
  minScore: string;
  totalPot: string;
  eligibleToJoin: string;
  join: string;
  totalMembers: string;
  member: string;
  members: string;
  month: string;
  months: string;
  jod: string;
  monthly: string;
  of: string;
  totalPotLabel: string;
  preview: string;
  profileScore: string;
  pointsToGold: string;
  totalPotLabelShort: string;
  totalPotValue: string;
  totalPotTitle: string;
  joinSuccess: string;
  all: string;
  spotsLeft: string;
};

function MarketplaceTopBar({
  locale,
  labels,
  onSwitchLocale,
}: Readonly<{
  locale: Locale;
  labels: MarketplaceStrings;
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
      <span style={{ fontWeight: 800, fontSize: 17, color: DS.colors.navy }}>{labels.marketplaceTitle}</span>
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

function MarketplaceTierBadge({ score, labels }: Readonly<{ score: number; labels: MarketplaceStrings }>) {
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
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function MarketplaceJamCard({
  jam,
  locale,
  labels,
  showJoin,
  onJoin,
  onOpen,
}: Readonly<{
  jam: BrowseJam;
  locale: Locale;
  labels: MarketplaceStrings;
  showJoin?: boolean;
  onJoin?: (jam: BrowseJam) => void;
  onOpen: (jam: BrowseJam) => void;
}>) {
  const isRtl = locale === 'ar';
  const theme = THEME_MAP[jam.theme as keyof typeof THEME_MAP] || {
    bg: DS.colors.card,
    icon: '◎',
    color: DS.colors.navy,
  };
  const tier = DS.getTier(jam.minScore || 0);
  const tierColor = TIER_STYLES[tier].color;

  return (
    <Card hover onClick={() => onOpen(jam)} style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
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
            <div style={{ width: 42, height: 42, borderRadius: 12, background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: theme.color }}>
              {theme.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: DS.colors.navy }}>{isRtl ? jam.nameAr : jam.nameEn}</div>
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
            <MarketplaceTierBadge score={jam.minScore || 0} labels={labels} />
            {jam.status === 'recruiting' && jam.slots && jam.slots > 0 && (
              <span style={{ background: DS.colors.successLight, color: DS.colors.success, borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                {jam.slots} {labels.spotsLeft}
              </span>
            )}
          </div>

          {showJoin && (
            <AppButton
              variant="gold"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onJoin?.(jam);
              }}
            >
              {labels.join}
            </AppButton>
          )}
        </div>

        {jam.status === 'active' && jam.currentMonth > 0 && (
          <div style={{ marginTop: 12 }}>
            <ProgressBar value={jam.currentMonth} max={jam.duration} color={tierColor} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: DS.colors.muted }}>
              <span>{isRtl ? `${labels.month} ${jam.currentMonth}` : `${labels.month} ${jam.currentMonth}`}</span>
              <span>{isRtl ? `${labels.of} ${jam.duration}` : `${labels.of} ${jam.duration}`}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function BrowseJam3iyyasPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('marketplace');
  const router = useRouter();
  const isRtl = locale === 'ar';

  // State for API data
  const [jams, setJams] = useState<BrowseJam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for UI filters
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | Tier>('all');
  const [filterAmt, setFilterAmt] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [joinModal, setJoinModal] = useState<BrowseJam | null>(null);
  const [joinToastMessage, setJoinToastMessage] = useState<string | null>(null);

  // Fetch circles from API
  useEffect(() => {
    const fetchJams = async () => {
      setError(null);
      try {
        setLoading(true);
        const response = await fetch('/api/jam3iyyas?status=recruiting&type=public&limit=50');
        
        if (!response.ok) {
          throw new Error(response.statusText || 'Failed to fetch circles');
        }
        
        const data = await response.json();
        
        // Transform API response to match Jam interface
        const transformed: BrowseJam[] = (data.jam3iyyas || []).map((jam: any) => ({
          id: jam.id.split('-')[0].charCodeAt(0) % 1000, // Simple numeric ID from UUID
          uuid: jam.id,
          nameAr: jam.name,
          nameEn: jam.name,
          amount: jam.monthly_amount,
          totalMembers: jam.total_members,
          duration: jam.duration_months,
          minScore: jam.min_trust_score || 100,
          type: jam.type,
          theme: 'default',
          currentMonth: 0,
          yourTurn: 0,
          status: jam.status,
          avgScore: 500 + Math.random() * 300,
          organizerAr: 'Creator',
          organizerEn: 'Creator',
          descriptionAr: jam.description || '',
          descriptionEn: jam.description || '',
          insuranceFund: (jam.monthly_amount * jam.total_members) * 0.1,
          totalPot: jam.monthly_amount * jam.total_members,
          members: [],
          slots: Math.max(0, jam.total_members - (jam.current_members_count || 0)),
        }));
        
        setJams(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setJams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJams();
  }, []);

  const labels: MarketplaceStrings = {
    marketplaceTitle: t('marketplaceTitle'),
    englishShort: t('englishShort'),
    arabicShort: t('arabicShort'),
    searchPlaceholder: t('searchPlaceholder'),
    allTiers: t('allTiers'),
    bronze: t('bronze'),
    silver: t('silver'),
    gold: t('gold'),
    platinum: t('platinum'),
    allAmounts: t('allAmounts'),
    under200: t('under200'),
    between200And500: t('between200And500'),
    over500: t('over500'),
    smartMatch: t('smartMatch'),
    suggestedForProfile: t('suggestedForProfile'),
    circlesAvailable: t('circlesAvailable'),
    noMatchingCircles: t('noMatchingCircles'),
    amount: t('amount'),
    duration: t('duration'),
    minScore: t('minScore'),
    totalPot: t('totalPot'),
    eligibleToJoin: t('eligibleToJoin'),
    join: t('join'),
    totalMembers: t('totalMembers'),
    member: t('member'),
    members: t('members'),
    month: t('month'),
    months: t('months'),
    jod: t('jod'),
    monthly: t('monthly'),
    of: t('of'),
    totalPotLabel: t('totalPotLabel'),
    preview: t('preview'),
    profileScore: t('profileScore'),
    pointsToGold: t('pointsToGold', { points: Math.max(0, 500 - MOCK_USER.trustScore) }),
    totalPotLabelShort: t('totalPotLabelShort'),
    totalPotValue: t('totalPotValue'),
    totalPotTitle: t('totalPotTitle'),
    joinSuccess: t('joinSuccess'),
    all: t('all'),
    spotsLeft: t('spotsLeft'),
  };

  const tierFilters: Array<{ id: 'all' | Tier; label: string }> = [
    { id: 'all', label: labels.allTiers },
    { id: 'bronze', label: labels.bronze },
    { id: 'silver', label: labels.silver },
    { id: 'gold', label: labels.gold },
    { id: 'platinum', label: labels.platinum },
  ];

  const amountFilters: Array<{ id: 'all' | 'low' | 'mid' | 'high'; label: string }> = [
    { id: 'all', label: labels.allAmounts },
    { id: 'low', label: labels.under200 },
    { id: 'mid', label: labels.between200And500 },
    { id: 'high', label: labels.over500 },
  ];

  const filtered = jams.filter((jam) => {
    const name = isRtl ? jam.nameAr : jam.nameEn;
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === 'all' || DS.getTier(jam.minScore || 0) === filterTier;
    const matchAmt =
      filterAmt === 'all' ||
      (filterAmt === 'low' && jam.amount < 200) ||
      (filterAmt === 'mid' && jam.amount >= 200 && jam.amount <= 500) ||
      (filterAmt === 'high' && jam.amount > 500);

    return matchSearch && matchTier && matchAmt;
  });

  const smartMatch = jams.find((jam) => jam.id === 3) || jams[0];

  const handleJoin = async (jam: BrowseJam) => {
    try {
      const response = await fetch(`/api/jam3iyyas/${jam.uuid}/join`, {
        method: 'POST',
      });

      const payload = await response.json();
      const isJoined = response.status === 200 || response.status === 201;
      const isAlreadyMember =
        payload?.error?.code === 'ALREADY_MEMBER' ||
        payload?.error?.message?.en === 'You are already a member';

      if (isAlreadyMember) {
        setJoinModal(null);
        setJoinToastMessage('أنت بالفعل عضو في هذه الجمعية');
        setTimeout(() => setJoinToastMessage(null), 3000);
        return;
      }

      if (!isJoined) {
        throw new Error(payload?.error?.message?.en || payload?.error || 'Join failed');
      }

      // Optimistic UI update: remove joined circle immediately from displayed list
      setJams((prev) => prev.filter((item) => item.uuid !== jam.uuid));
      setJoinModal(null);
      setJoinToastMessage(labels.joinSuccess);

      setTimeout(() => {
        setJoinToastMessage(null);
        router.push('/ar/dashboard');
      }, 1500);
    } catch (joinError) {
      setJoinModal(null);
      setError(joinError instanceof Error ? joinError.message : 'Join failed');
    }
  };

  const openJam = (jam: BrowseJam) => {
    router.push(`/${locale}/jam3iyyas/${jam.uuid}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, paddingBottom: 90 }} data-screen-label="Marketplace">
      <MarketplaceTopBar locale={locale} labels={labels} onSwitchLocale={() => router.push(`/${isRtl ? 'en' : 'ar'}/jam3iyyas/browse`)} />

      <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={labels.searchPlaceholder}
            style={{ width: '100%', background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: isRtl ? '12px 44px 12px 14px' : '12px 14px 12px 44px', fontSize: 14, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: 14, color: DS.colors.muted }}>
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 10, scrollbarWidth: 'none' }}>
          {tierFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterTier(filter.id)}
              style={{ flexShrink: 0, background: filterTier === filter.id ? DS.colors.navy : DS.colors.card, color: filterTier === filter.id ? '#fff' : DS.colors.muted, border: `1px solid ${filterTier === filter.id ? DS.colors.navy : DS.colors.border}`, borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
          {amountFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterAmt(filter.id)}
              style={{ flexShrink: 0, background: filterAmt === filter.id ? DS.colors.goldBg : DS.colors.card, color: filterAmt === filter.id ? DS.colors.gold : DS.colors.muted, border: `1px solid ${filterAmt === filter.id ? DS.colors.gold : DS.colors.border}`, borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 24, marginBottom: 12, color: DS.colors.muted, animation: 'spin 2s linear infinite' }}>◎</div>
            <div style={{ color: DS.colors.muted, fontSize: 14 }}>Loading circles...</div>
          </div>
        )}

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: DS.radii.md, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ color: '#DC2626', fontSize: 14, fontWeight: 500 }}>Error loading circles</div>
            <div style={{ color: '#991B1B', fontSize: 12, marginTop: 4 }}>{error}</div>
          </div>
        )}

        {!loading && !error && (
          <>
        {!search && smartMatch && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: DS.colors.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: DS.colors.gold }}>✦</div>
              <span style={{ fontWeight: 800, fontSize: 14, color: DS.colors.navy }}>{labels.smartMatch}</span>
              <span style={{ fontSize: 11, color: DS.colors.muted }}>{labels.suggestedForProfile}</span>
            </div>

            <div
              style={{ background: `linear-gradient(135deg, ${DS.colors.navy} 0%, ${DS.colors.navyMid} 100%)`, borderRadius: DS.radii.lg, padding: 18, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => smartMatch && openJam(smartMatch)}
            >
              <GeoBg opacity={0.06} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>◉</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{isRtl ? smartMatch.nameAr : smartMatch.nameEn}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        {smartMatch.totalMembers} {labels.members} · {smartMatch.duration} {smartMatch.duration === 1 ? labels.month : labels.months}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: isRtl ? 'start' : 'end' }}>
                    <div style={{ fontWeight: 900, fontSize: 22, color: DS.colors.gold }}>{smartMatch.amount}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{labels.jod}{labels.monthly}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: DS.radii.md, padding: '8px 12px', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    {isRtl
                      ? `✦ مثالية لملفك — متوسط درجة الثقة ${Math.round(smartMatch.avgScore)} · ${smartMatch.slots} ${labels.spotsLeft}`
                      : `✦ Perfect for your profile — avg trust score ${Math.round(smartMatch.avgScore)} · ${smartMatch.slots} ${labels.spotsLeft}`}
                  </span>
                </div>

                <AppButton variant="gold" size="sm" onClick={(event) => {
                  event.stopPropagation();
                  setJoinModal(smartMatch);
                }}>
                  {labels.join}
                </AppButton>
              </div>
            </div>
          </div>
        )}

        <div style={{ fontWeight: 700, fontSize: 13, color: DS.colors.muted, marginBottom: 12 }}>
          {filtered.length} {labels.circlesAvailable}
        </div>

        {filtered.map((jam) => (
          <MarketplaceJamCard
            key={jam.id}
            jam={jam}
            locale={locale}
            labels={labels}
            showJoin={jam.status === 'recruiting'}
            onJoin={(nextJam) => setJoinModal(nextJam)}
            onOpen={openJam}
          />
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12, color: DS.colors.muted }}>◎</div>
            <div style={{ color: DS.colors.muted, fontSize: 15 }}>{labels.noMatchingCircles}</div>
          </div>
        )}
          </>
        )}
      </div>

      {joinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,60,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setJoinModal(null)}>
          <div style={{ background: DS.colors.card, borderRadius: `${DS.radii.xl}px ${DS.radii.xl}px 0 0`, padding: '28px 24px 40px', width: '100%', maxWidth: 480 }} onClick={(event) => event.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: DS.colors.mutedLight, margin: '0 auto 24px', display: 'block' }} />
            <h3 style={{ fontWeight: 800, fontSize: 19, color: DS.colors.navy, marginBottom: 6 }}>
              {isRtl ? joinModal.nameAr : joinModal.nameEn}
            </h3>
            <p style={{ color: DS.colors.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {isRtl ? joinModal.descriptionAr : joinModal.descriptionEn}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: labels.amount, val: `${joinModal.amount} ${labels.jod}${labels.monthly}` },
                { label: labels.duration, val: `${joinModal.duration} ${joinModal.duration === 1 ? labels.month : labels.months}` },
                { label: labels.totalPotTitle, val: `${joinModal.amount * joinModal.totalMembers} ${labels.jod}` },
                { label: labels.minScore, val: joinModal.minScore.toString() },
              ].map((item) => (
                <div key={item.label} style={{ background: DS.colors.bg, borderRadius: DS.radii.md, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: DS.colors.muted, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy }}>{item.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: DS.colors.successLight, borderRadius: DS.radii.md, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: DS.colors.success, fontSize: 18 }}>◈</span>
              <span style={{ fontSize: 13, color: DS.colors.success, fontWeight: 600 }}>
                {isRtl
                  ? `درجة ثقتك ${MOCK_USER.trustScore} — ${labels.eligibleToJoin} ✓`
                  : `Your score ${MOCK_USER.trustScore} — ${labels.eligibleToJoin} ✓`}
              </span>
            </div>
            <AppButton variant="gold" size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleJoin(joinModal)}>
              {labels.join}
            </AppButton>
          </div>
        </div>
      )}

      {joinToastMessage && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: DS.colors.success, color: '#fff', borderRadius: DS.radii.md, padding: '12px 24px', fontWeight: 700, fontSize: 14, zIndex: 300, boxShadow: DS.shadow.lg, whiteSpace: 'nowrap', animation: 'slideUp 0.3s ease' }}>
          {joinToastMessage}
        </div>
      )}

      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}