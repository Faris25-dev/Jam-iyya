'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Circle, TrendingUp, TrendingDown, Shield, Landmark, Activity } from 'lucide-react';

import { DS } from '@/components/prototype/design-system';
import { Card, TopBar, AppButton } from '@/components/prototype/ui-library';
import { EmptyState } from '@/components/shared/empty-state';

type Locale = 'ar' | 'en';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BreakdownCategory = { identity: number; financial: number; behavioral: number };

type HistoryItem = {
  id?: string;
  points: number;
  description: string;
  category: 'identity' | 'financial' | 'behavioral';
  timestamp: string;
  new_total_score?: number;
};

type FactorStatus = {
  hasUploadedId: boolean;
  hasUploadedSelfie: boolean;
  hasLinkedBank: boolean;
  hasIncomeDoc: boolean;
  phoneAgeMonths: number;
};

// ---------------------------------------------------------------------------
// SVG Gauge Component
// ---------------------------------------------------------------------------
function ScoreGauge({ score, tier, size = 220 }: { score: number; tier: string; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // half-circle
  const maxScore = 1000;
  const pct = Math.min(score / maxScore, 1);
  const offset = circumference * (1 - pct);

  const tierColors: Record<string, string> = {
    bronze: DS.colors.bronze,
    silver: DS.colors.silver,
    gold: DS.colors.gold,
    platinum: DS.colors.platinum,
  };

  const strokeColor = tierColors[tier] || DS.colors.gold;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          fill="#fff"
          fontSize={42}
          fontWeight={900}
          fontFamily="system-ui"
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 22}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={13}
          fontWeight={600}
        >
          / 1000
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------
function Skeleton({ width = '100%', height = 16, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        background: `linear-gradient(90deg, ${DS.colors.mutedLight} 25%, rgba(13,31,60,0.05) 50%, ${DS.colors.mutedLight} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Category Bar Component
// ---------------------------------------------------------------------------
function CategoryBar({
  icon,
  label,
  points,
  maxPoints,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  points: number;
  maxPoints: number;
  color: string;
}) {
  const pct = maxPoints > 0 ? Math.min((Math.abs(points) / maxPoints) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 14, fontWeight: 700, color: DS.colors.navy, flex: 1 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{points > 0 ? '+' : ''}{points}</span>
      </div>
      <div style={{ height: 6, background: DS.colors.mutedLight, borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function TrustScorePage() {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale === 'ar' ? 'ar' : 'en') as Locale;
  const isRtl = locale === 'ar';

  // State
  const [score, setScore] = useState<number>(0);
  const [tier, setTier] = useState<string>('bronze');
  const [breakdown, setBreakdown] = useState<BreakdownCategory>({ identity: 0, financial: 0, behavioral: 0 });
  const [factors, setFactors] = useState<FactorStatus>({
    hasUploadedId: false,
    hasUploadedSelfie: false,
    hasLinkedBank: false,
    hasIncomeDoc: false,
    phoneAgeMonths: 0,
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch Breakdown
  // ---------------------------------------------------------------------------
  const loadBreakdown = async () => {
    try {
      const res = await fetch('/api/trust-score/breakdown');
      if (!res.ok) {
        if (res.status === 401) {
          setError(isRtl ? 'يرجى تسجيل الدخول' : 'Please log in');
          return;
        }
        throw new Error('Failed to load breakdown');
      }
      const data = await res.json();
      setScore(data.score ?? 0);
      setTier(data.tier ?? 'bronze');
      setBreakdown(data.breakdown ?? { identity: 0, financial: 0, behavioral: 0 });
      setFactors(data.factors ?? factors);
      setHistory(data.history ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBreakdown();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Recalculate Score
  // ---------------------------------------------------------------------------
  const recalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/api/trust-score/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(factors),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setTier(data.tier);
        // Refresh full breakdown
        await loadBreakdown();
      }
    } finally {
      setRecalculating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Tier badge
  // ---------------------------------------------------------------------------
  const tierMeta = useMemo(() => {
    const map: Record<string, { label: { ar: string; en: string }; color: string; bg: string }> = {
      bronze: { label: { ar: 'برونز', en: 'Bronze' }, color: DS.colors.bronze, bg: DS.colors.bronzeBg },
      silver: { label: { ar: 'فضي', en: 'Silver' }, color: DS.colors.silver, bg: DS.colors.silverBg },
      gold: { label: { ar: 'ذهبي', en: 'Gold' }, color: DS.colors.goldTier, bg: DS.colors.goldTierBg },
      platinum: { label: { ar: 'بلاتيني', en: 'Platinum' }, color: DS.colors.platinum, bg: DS.colors.platinumBg },
    };
    return map[tier] || map.bronze;
  }, [tier]);

  // ---------------------------------------------------------------------------
  // Completed factors count
  // ---------------------------------------------------------------------------
  const completedCount = [factors.hasUploadedId, factors.hasUploadedSelfie, factors.hasLinkedBank, factors.hasIncomeDoc, factors.phoneAgeMonths > 0]
    .filter(Boolean).length;

  const title = isRtl ? 'درجة الثقة' : 'Trust Score';

  // EDGE CASE: Check if user is completely new (no score, no history, no factors)
  const isCompletelyNew = score === 0 && history.length === 0 && completedCount === 0;

  // ---------------------------------------------------------------------------
  // Factor items
  // ---------------------------------------------------------------------------
  const factorList = [
    { key: 'id', label: isRtl ? 'الهوية الوطنية' : 'National ID', done: factors.hasUploadedId, pts: 150 },
    { key: 'selfie', label: isRtl ? 'الصورة الشخصية' : 'Selfie Verification', done: factors.hasUploadedSelfie, pts: 50 },
    { key: 'bank', label: isRtl ? 'حساب بنكي مرتبط' : 'Linked Bank Account', done: factors.hasLinkedBank, pts: 200 },
    { key: 'income', label: isRtl ? 'إثبات الدخل' : 'Income Proof', done: factors.hasIncomeDoc, pts: 100 },
    { key: 'phone', label: isRtl ? `عمر رقم الهاتف: ${factors.phoneAgeMonths} شهر` : `Phone Age: ${factors.phoneAgeMonths} months`, done: factors.phoneAgeMonths > 0, pts: 100 },
  ];

  // EMPTY STATE COMPONENT - For brand new users with no history
  const emptyStateLabels = {
    ar: {
      title: 'لا توجد درجة ثقة بعد',
      description: 'ابدأ رحلتك بتحميل هويتك والتحقق من حسابك البنكي لبناء درجة ثقة قوية.',
      action: 'البدء الآن'
    },
    en: {
      title: 'No trust score yet',
      description: 'Start building your trust score by verifying your identity and linking your bank account.',
      action: 'Get Started'
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg }} dir={isRtl ? 'rtl' : 'ltr'}>
      <TopBar
        title={title}
        onBack={() => window.history.back()}
        lang={locale}
        setLang={(next) => window.location.assign(`/${next}/trust-score`)}
      />

      {/* Shimmer keyframe */}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      <div style={{ padding: 16, maxWidth: 540, margin: '0 auto' }}>

        {/* ---- Error State ---- */}
        {error && (
          <Card style={{ padding: 16, marginBottom: 16, background: DS.colors.errorLight, border: `1px solid ${DS.colors.error}` }}>
            <div style={{ color: DS.colors.error, fontSize: 14, fontWeight: 600 }}>{error}</div>
          </Card>
        )}

        {/* ---- EMPTY STATE: Brand New User ---- */}
        {!loading && isCompletelyNew && (
          <div style={{ marginBottom: 24 }}>
            <EmptyState
              title={isRtl ? emptyStateLabels.ar.title : emptyStateLabels.en.title}
              description={isRtl ? emptyStateLabels.ar.description : emptyStateLabels.en.description}
            />
            <div style={{ marginTop: 16 }}>
              <AppButton
                variant="gold"
                size="lg"
                onClick={() => window.location.assign(`/${locale}/settings`)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isRtl ? '🎯 البدء' : '🎯 Get Started'}
              </AppButton>
            </div>
          </div>
        )}

        {/* ---- Score Hero Card ---- */}
        {!isCompletelyNew && (
          <Card
          style={{
            padding: '24px 18px',
            marginBottom: 16,
            background: `linear-gradient(135deg, ${DS.colors.navy} 0%, #142d55 100%)`,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circle */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(196,150,62,0.08)',
            }}
          />

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
              <Skeleton width={220} height={120} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.1)' }} />
              <Skeleton width={120} height={28} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.1)' }} />
            </div>
          ) : (
            <>
              <ScoreGauge score={score} tier={tier} />

              {/* Tier Badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 16px',
                    borderRadius: 20,
                    background: tierMeta.bg,
                    border: `1.5px solid ${tierMeta.color}`,
                  }}
                >
                  <Shield size={14} color={tierMeta.color} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: tierMeta.color }}>
                    {isRtl ? tierMeta.label.ar : tierMeta.label.en}
                  </span>
                </div>
              </div>

              {/* Update Button */}
              <div style={{ marginTop: 16 }}>
                <AppButton
                  variant="gold"
                  size="lg"
                  onClick={() => void recalculate()}
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading || recalculating}
                >
                  {recalculating
                    ? (isRtl ? 'جاري التحديث...' : 'Updating...')
                    : (isRtl ? 'تحديث الدرجة' : 'Update Score')}
                </AppButton>
              </div>
            </>
          )}
        </Card>
        )}

        {/* ---- Category Breakdown ---- */}
        {!isCompletelyNew && (
          <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy, marginBottom: 14 }}>
            {isRtl ? 'تفصيل النقاط' : 'Score Breakdown'}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Skeleton height={36} />
              <Skeleton height={36} />
              <Skeleton height={36} />
            </div>
          ) : (
            <>
              <CategoryBar
                icon={<Shield size={18} color={DS.colors.navy} />}
                label={isRtl ? 'الهوية والتحقق' : 'Identity & Verification'}
                points={breakdown.identity}
                maxPoints={350}
                color="#4C7ADB"
              />
              <CategoryBar
                icon={<Landmark size={18} color={DS.colors.gold} />}
                label={isRtl ? 'المالية' : 'Financial'}
                points={breakdown.financial}
                maxPoints={300}
                color={DS.colors.gold}
              />
              <CategoryBar
                icon={<Activity size={18} color={DS.colors.success} />}
                label={isRtl ? 'السلوك' : 'Behavioral'}
                points={breakdown.behavioral}
                maxPoints={350}
                color={DS.colors.success}
              />
            </>
          )}
        </Card>
        )}

        {/* ---- Verification Factors Checklist ---- */}
        {!isCompletelyNew && (
          <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>
              {isRtl ? 'عوامل الثقة' : 'Trust Factors'}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: completedCount === 5 ? DS.colors.success : DS.colors.muted,
                background: completedCount === 5 ? DS.colors.successLight : DS.colors.mutedLight,
                padding: '3px 10px',
                borderRadius: 12,
              }}
            >
              {completedCount}/5
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={32} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {factorList.map((f) => (
                <div
                  key={f.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: `1px solid ${DS.colors.border}`,
                  }}
                >
                  {f.done ? (
                    <CheckCircle2 size={20} color={DS.colors.success} />
                  ) : (
                    <Circle size={20} color={DS.colors.muted} />
                  )}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: f.done ? DS.colors.navy : DS.colors.muted,
                      flex: 1,
                    }}
                  >
                    {f.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: f.done ? DS.colors.success : DS.colors.muted,
                    }}
                  >
                    {f.done ? `+${f.pts}` : `+${f.pts}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        )}

        {/* ---- History Timeline ---- */}
        {!isCompletelyNew && (
          <Card style={{ padding: 16, marginBottom: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy, marginBottom: 12 }}>
            {isRtl ? 'سجل التغييرات' : 'Score History'}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height={56} />)}
            </div>
          ) : history.length === 0 ? (
            <div style={{ fontSize: 13, color: DS.colors.muted, textAlign: 'center', padding: '20px 0' }}>
              {isRtl ? 'لا يوجد سجل بعد. قم بتحميل هويتك لتبدأ!' : 'No history yet. Upload your ID to get started!'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((item, index) => {
                const isPositive = item.points >= 0;
                return (
                  <div
                    key={item.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 12,
                      background: DS.colors.bg,
                      borderRadius: DS.radii.md,
                      border: `1px solid ${DS.colors.border}`,
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isPositive ? DS.colors.successLight : DS.colors.errorLight,
                        flexShrink: 0,
                      }}
                    >
                      {isPositive ? (
                        <TrendingUp size={16} color={DS.colors.success} />
                      ) : (
                        <TrendingDown size={16} color={DS.colors.error} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: DS.colors.navy }}>
                          {item.description}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: isPositive ? DS.colors.success : DS.colors.error,
                            flexShrink: 0,
                          }}
                        >
                          {isPositive ? '+' : ''}{item.points}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: DS.colors.muted }}>
                          {new Date(item.timestamp).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {item.new_total_score !== undefined && (
                          <span style={{ fontSize: 11, color: DS.colors.muted }}>
                            {isRtl ? 'المجموع' : 'Total'}: {item.new_total_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        )}
      </div>
    </div>
  );
}