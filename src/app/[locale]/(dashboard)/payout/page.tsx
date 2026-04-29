'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AppButton, Card, GeoBg } from '@/components/prototype/ui-library';
import { DS } from '@/components/prototype/design-system';
import { MOCK_JAMS } from '@/components/prototype/mock-data';

type Locale = 'ar' | 'en';

type PayoutStrings = {
  payoutDay: string;
  payoutMessage: string;
  businessCapitalTurn: string;
  memberContributions: string;
  members: string;
  circle: string;
  youWillReceive: string;
  seeInsuranceFundInAction: string;
  missingAmount: string;
  fundCovered: string;
  fundBalance: string;
  yourLoss: string;
  zero: string;
  lostNothing: string;
  insuranceKickedIn: string;
  defaultMsg: string;
  backToDashboard: string;
  englishShort: string;
  arabicShort: string;
  jod: string;
  payoutAmount: string;
};

export default function PayoutPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('payout');
  const router = useRouter();
  const isRtl = locale === 'ar';
  const jam = MOCK_JAMS[1];
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [moneyAnim, setMoneyAnim] = useState(false);

  // TODO: payout amount, insurance state, and turn metadata should come from Person 2's payout data.
  const labels: PayoutStrings = {
    payoutDay: t('payoutDay'),
    payoutMessage: t('payoutMessage'),
    businessCapitalTurn: t('businessCapitalTurn'),
    memberContributions: t('memberContributions'),
    members: t('members'),
    circle: t('circle'),
    youWillReceive: t('youWillReceive'),
    seeInsuranceFundInAction: t('seeInsuranceFundInAction'),
    missingAmount: t('missingAmount'),
    fundCovered: t('fundCovered'),
    fundBalance: t('fundBalance'),
    yourLoss: t('yourLoss'),
    zero: t('zero'),
    lostNothing: t('lostNothing'),
    insuranceKickedIn: t('insuranceKickedIn'),
    defaultMsg: t('defaultMsg'),
    backToDashboard: t('backToDashboard'),
    englishShort: t('englishShort'),
    arabicShort: t('arabicShort'),
    jod: t('jod'),
    payoutAmount: t('payoutAmount'),
  };

  useEffect(() => {
    const moneyTimer = window.setTimeout(() => setMoneyAnim(true), 300);
    const confettiTimer = window.setTimeout(() => setShowConfetti(true), 1200);

    return () => {
      window.clearTimeout(moneyTimer);
      window.clearTimeout(confettiTimer);
    };
  }, []);

  const confettiColors = [DS.colors.gold, '#fff', DS.colors.navy, '#e8f4ee', DS.colors.goldLight];
  const confettiPieces = Array.from({ length: 36 }, (_, index) => ({
    id: index,
    color: confettiColors[index % confettiColors.length],
    x: 10 + Math.random() * 80,
    delay: Math.random() * 1.5,
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
    dur: 2.5 + Math.random() * 1.5,
  }));

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.navy, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} data-screen-label="Payout Day">
      <GeoBg opacity={0.05} />

      {showConfetti &&
        confettiPieces.map((piece) => (
          <div
            key={piece.id}
            style={{
              position: 'fixed',
              top: '-20px',
              left: `${piece.x}%`,
              width: piece.size,
              height: piece.size * 0.5,
              background: piece.color,
              borderRadius: 2,
              zIndex: 10,
              transform: `rotate(${piece.rotate}deg)`,
              animation: `fall ${piece.dur}s ${piece.delay}s ease-in both`,
            }}
          />
        ))}

      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 5 }}>
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
          </svg>
        </button>
        <button
          onClick={() => router.push(`/${locale}/payout`)}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}
        >
          {locale === 'ar' ? labels.englishShort : labels.arabicShort}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 24px', position: 'relative', zIndex: 5, textAlign: 'center' }}>
        <div style={{ background: DS.colors.gold, borderRadius: 999, padding: '6px 18px', marginBottom: 24, display: 'inline-block' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.04em' }}>
            {labels.payoutDay}
          </span>
        </div>

        <h1 style={{ color: '#fff', fontSize: isRtl ? 26 : 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>
          {labels.payoutMessage}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 40 }}>
          {isRtl ? labels.businessCapitalTurn : labels.businessCapitalTurn}
        </p>

        <div style={{ position: 'relative', marginBottom: 48 }}>
          <div style={{ width: 200, height: 200, borderRadius: 999, background: 'rgba(196,150,62,0.15)', border: `2px solid ${DS.colors.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)', transform: moneyAnim ? 'scale(1)' : 'scale(0.5)', opacity: moneyAnim ? 1 : 0 }}>
            <div style={{ width: 160, height: 160, borderRadius: 999, background: 'rgba(196,150,62,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: DS.colors.gold, letterSpacing: '-0.02em', lineHeight: 1 }}>5,000</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600, marginTop: 4 }}>{labels.jod}</div>
              </div>
            </div>
          </div>

          {moneyAnim &&
            [0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: DS.colors.gold,
                  transform: `translate(-50%,-50%) translate(${Math.cos((index / 8) * Math.PI * 2) * 110}px,${Math.sin((index / 8) * Math.PI * 2) * 110}px)`,
                  opacity: 0.6,
                  animation: `orbit 3s ${index * 0.2}s linear infinite`,
                }}
              />
            ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: DS.radii.lg, padding: 20, width: '100%', maxWidth: 380, marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { label: labels.memberContributions, val: `${jam.amount * jam.totalMembers} ${labels.jod}`, color: '#fff' },
            { label: labels.members, val: jam.totalMembers, color: 'rgba(255,255,255,0.6)' },
            { label: labels.circle, val: isRtl ? jam.nameAr : jam.nameEn, color: 'rgba(255,255,255,0.6)' },
            { label: labels.youWillReceive, val: labels.payoutAmount, color: DS.colors.gold, bold: true },
          ].map((row, index) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: 8, borderBottom: index < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: row.bold ? 800 : 600, color: row.color }}>{row.val}</span>
            </div>
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: 380, marginBottom: 24 }}>
          <button
            onClick={() => setShowInsurance((current) => !current)}
            style={{ width: '100%', background: showInsurance ? 'rgba(196,150,62,0.2)' : 'rgba(255,255,255,0.07)', border: `1px solid ${showInsurance ? DS.colors.gold : 'rgba(255,255,255,0.12)'}`, borderRadius: DS.radii.md, padding: '13px 16px', cursor: 'pointer', fontFamily: 'inherit', color: showInsurance ? DS.colors.gold : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
          >
            <span>◈ {labels.seeInsuranceFundInAction}</span>
            <span style={{ fontSize: 18 }}>{showInsurance ? '▲' : '▼'}</span>
          </button>

          {showInsurance && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${DS.colors.gold}30`, borderTop: 'none', borderRadius: `0 0 ${DS.radii.md}px ${DS.radii.md}px`, padding: 16, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${DS.colors.error}30`, border: `1px solid ${DS.colors.error}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: DS.colors.error, fontSize: 16 }}>!</span>
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{labels.insuranceKickedIn}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6 }}>{labels.defaultMsg}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: labels.missingAmount, val: `500 ${labels.jod}`, color: DS.colors.error },
                  { label: labels.fundCovered, val: `500 ${labels.jod}`, color: DS.colors.success },
                  { label: labels.fundBalance, val: `${jam.insuranceFund} ${labels.jod}`, color: DS.colors.gold },
                  { label: labels.yourLoss, val: labels.zero, color: DS.colors.success },
                ].map((item) => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: DS.radii.sm, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '10px 12px', background: `${DS.colors.success}20`, borderRadius: DS.radii.sm, border: `1px solid ${DS.colors.success}40` }}>
                <span style={{ color: DS.colors.success, fontSize: 12, fontWeight: 600 }}>
                  ✓ {labels.lostNothing}
                </span>
              </div>
            </div>
          )}
        </div>

        <AppButton variant="gold" size="lg" style={{ width: '100%', maxWidth: 380, justifyContent: 'center' }} onClick={() => router.push(`/${locale}/dashboard`)}>
          {labels.backToDashboard}
        </AppButton>
      </div>

      <style>{`
        @keyframes fall { from { transform: translateY(-20px) rotate(0deg); opacity:1; } to { transform: translateY(110vh) rotate(720deg); opacity:0; } }
        @keyframes orbit { from { transform: translate(-50%,-50%) rotate(0deg) translateX(110px); } to { transform: translate(-50%,-50%) rotate(360deg) translateX(110px); } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}