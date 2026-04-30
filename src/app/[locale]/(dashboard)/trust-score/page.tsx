'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';

import { DS } from '@/components/prototype/design-system';
import { Card, TopBar, AppButton } from '@/components/prototype/ui-library';

type Locale = 'ar' | 'en';

type TrustHistoryRow = {
  id: string;
  score_change: number;
  new_total_score: number;
  reason: string;
  created_at: string;
};

type TrustFactors = {
  hasUploadedId: boolean;
  hasUploadedSelfie: boolean;
  phoneAgeMonths: number;
  hasLinkedBank: boolean;
  hasIncomeDoc: boolean;
};

const DEFAULT_FACTORS: TrustFactors = {
  hasUploadedId: false,
  hasUploadedSelfie: false,
  phoneAgeMonths: 6,
  hasLinkedBank: false,
  hasIncomeDoc: false,
};

export default function TrustScorePage() {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale === 'ar' ? 'ar' : 'en') as Locale;
  const isRtl = locale === 'ar';

  const [history, setHistory] = useState<TrustHistoryRow[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [factors, setFactors] = useState<TrustFactors>(DEFAULT_FACTORS);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingScore, setLoadingScore] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current score and factors
        const scoreRes = await fetch('/api/trust-score');
        if (scoreRes.ok) {
          const profile = await scoreRes.json();
          setScore(profile.trust_score);
          setTier(profile.tier);
          setFactors({
            hasUploadedId: !!profile.has_uploaded_id,
            hasUploadedSelfie: !!profile.has_uploaded_selfie,
            phoneAgeMonths: profile.phone_age_months || 6,
            hasLinkedBank: !!profile.has_linked_bank,
            hasIncomeDoc: !!profile.has_income_doc,
          });
        }

        // Load history
        const historyRes = await fetch('/api/trust-score/history');
        if (historyRes.ok) {
          const payload = (await historyRes.json()) as { history: TrustHistoryRow[] };
          setHistory(payload.history ?? []);
        }
      } finally {
        setLoadingData(false);
      }
    };

    void loadData();
  }, []);

  const calculateScore = async () => {
    setLoadingScore(true);
    try {
      const response = await fetch('/api/trust-score/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(factors),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { score: number; tier: string };
      setScore(payload.score);
      setTier(payload.tier);

      // Refresh history after calculation
      const historyRes = await fetch('/api/trust-score/history');
      if (historyRes.ok) {
        const histPayload = await historyRes.json();
        setHistory(histPayload.history ?? []);
      }
    } finally {
      setLoadingScore(false);
    }
  };

  const title = isRtl ? 'درجة الثقة' : 'Trust score';

  const FactorItem = ({ label, isCompleted }: { label: string; isCompleted: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${DS.colors.border}` }}>
      {isCompleted ? <CheckCircle2 size={20} color={DS.colors.success} /> : <Circle size={20} color={DS.colors.muted} />}
      <span style={{ fontSize: 14, color: isCompleted ? DS.colors.navy : DS.colors.muted }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg }}>
      <TopBar title={title} onBack={() => window.history.back()} lang={locale} setLang={(nextLocale) => window.location.assign(`/${nextLocale}/trust-score`)} />

      <div style={{ padding: 16, maxWidth: 540, margin: '0 auto' }}>
        <Card style={{ padding: 18, marginBottom: 16, background: DS.colors.navy, color: '#fff' }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{isRtl ? 'النتيجة الحالية' : 'Current score'}</div>
          {loadingData ? (
             <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.8 }}>...</div>
          ) : (
            <>
              <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{score ?? '—'}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {tier ? `${isRtl ? 'الفئة' : 'Tier'}: ${tier.toUpperCase()}` : isRtl ? 'لا يوجد فئة' : 'No tier'}
              </div>
            </>
          )}
          <div style={{ marginTop: 14 }}>
            <AppButton variant="gold" size="lg" onClick={() => void calculateScore()} style={{ width: '100%', justifyContent: 'center' }} disabled={loadingData || loadingScore}>
              {loadingScore ? (isRtl ? 'جاري التحديث...' : 'Updating...') : isRtl ? 'تحديث الدرجة' : 'Update score'}
            </AppButton>
          </div>
        </Card>

        {/* Trust Factors Breakdown */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy, marginBottom: 10 }}>{isRtl ? 'عوامل الثقة' : 'Trust Factors'}</div>
          {loadingData ? (
            <div style={{ fontSize: 13, color: DS.colors.muted }}>{isRtl ? 'جاري التحميل...' : 'Loading factors...'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <FactorItem label={isRtl ? 'الهوية الوطنية المرفوعة' : 'Uploaded National ID'} isCompleted={factors.hasUploadedId} />
              <FactorItem label={isRtl ? 'الصورة الشخصية المرفوعة' : 'Uploaded Selfie'} isCompleted={factors.hasUploadedSelfie} />
              <FactorItem label={isRtl ? 'حساب بنكي موثق' : 'Linked Bank Account'} isCompleted={factors.hasLinkedBank} />
              <FactorItem label={isRtl ? 'إثبات الدخل المرفوع' : 'Income Proof Uploaded'} isCompleted={factors.hasIncomeDoc} />
              <FactorItem label={isRtl ? `عمر رقم الجوال: ${factors.phoneAgeMonths} أشهر` : `Phone Number Age: ${factors.phoneAgeMonths} months`} isCompleted={factors.phoneAgeMonths > 0} />
            </div>
          )}
        </Card>

        {/* History */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy, marginBottom: 10 }}>{isRtl ? 'سجل التغييرات' : 'History'}</div>
          {loadingData ? <div style={{ fontSize: 13, color: DS.colors.muted }}>{isRtl ? 'جاري تحميل السجل...' : 'Loading history...'}</div> : null}
          {!loadingData && history.length === 0 ? <div style={{ fontSize: 13, color: DS.colors.muted }}>{isRtl ? 'لا يوجد سجل بعد.' : 'No history yet.'}</div> : null}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((item) => (
              <div key={item.id} style={{ border: `1px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: 12, background: DS.colors.card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <strong style={{ color: DS.colors.navy }}>{(item.new_total_score - item.score_change) ?? 0} → {item.new_total_score}</strong>
                  <span style={{ color: DS.colors.muted, fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div style={{ color: DS.colors.muted, fontSize: 13, lineHeight: 1.5 }}>{item.reason}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}