'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { DS } from '@/components/prototype/design-system';
import { Card, TopBar, AppButton } from '@/components/prototype/ui-library';

type Locale = 'ar' | 'en';

type TrustHistoryRow = {
  id: string;
  old_score: number;
  new_score: number;
  reason: string;
  created_at: string;
};

const INITIAL_FACTORS = {
  hasUploadedId: true,
  hasUploadedSelfie: true,
  phoneAgeMonths: 12,
  hasLinkedBank: true,
  hasIncomeDoc: false,
};

export default function TrustScorePage() {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale === 'ar' ? 'ar' : 'en') as Locale;
  const isRtl = locale === 'ar';

  const [history, setHistory] = useState<TrustHistoryRow[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingScore, setLoadingScore] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch('/api/trust-score/history');
        if (response.status === 401) return;

        if (response.ok) {
          const payload = (await response.json()) as { history: TrustHistoryRow[] };
          setHistory(payload.history ?? []);
          if ((payload.history ?? []).length > 0) {
            setScore(payload.history[0].new_score);
          }
        }
      } finally {
        setLoadingHistory(false);
      }
    };

    void loadHistory();
  }, []);

  const calculateScore = async () => {
    setLoadingScore(true);
    try {
      const response = await fetch('/api/trust-score/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(INITIAL_FACTORS),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { score: number; tier: string };
      setScore(payload.score);
      setTier(payload.tier);
    } finally {
      setLoadingScore(false);
    }
  };

  const title = isRtl ? 'درجة الثقة' : 'Trust score';

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg }}>
      <TopBar title={title} onBack={() => window.history.back()} lang={locale} setLang={(nextLocale) => window.location.assign(`/${nextLocale}/trust-score`)} />

      <div style={{ padding: 16, maxWidth: 540, margin: '0 auto' }}>
        <Card style={{ padding: 18, marginBottom: 16, background: DS.colors.navy, color: '#fff' }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{isRtl ? 'النتيجة الحالية' : 'Current score'}</div>
          <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{score ?? '—'}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{tier ? `${isRtl ? 'الفئة' : 'Tier'}: ${tier}` : isRtl ? 'اضغط احسب لمعرفة الفئة' : 'Run a calculation to preview your tier'}</div>
          <div style={{ marginTop: 14 }}>
            <AppButton variant="gold" size="lg" onClick={() => void calculateScore()} style={{ width: '100%', justifyContent: 'center' }}>
              {loadingScore ? (isRtl ? 'جاري الحساب...' : 'Calculating...') : isRtl ? 'احسب الدرجة' : 'Calculate score'}
            </AppButton>
          </div>
        </Card>

        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy, marginBottom: 10 }}>{isRtl ? 'سجل التغييرات' : 'History'}</div>
          {loadingHistory ? <div style={{ fontSize: 13, color: DS.colors.muted }}>{isRtl ? 'جاري تحميل السجل...' : 'Loading history...'}</div> : null}
          {!loadingHistory && history.length === 0 ? <div style={{ fontSize: 13, color: DS.colors.muted }}>{isRtl ? 'لا يوجد سجل بعد.' : 'No history yet.'}</div> : null}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((item) => (
              <div key={item.id} style={{ border: `1px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: 12, background: DS.colors.card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <strong style={{ color: DS.colors.navy }}>{item.old_score} → {item.new_score}</strong>
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