'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AppButton,
  Card,
  TierBadge,
  TrustGauge,
  GeoBg,
} from '@/components/prototype/ui-library';
import { DS, STRINGS } from '@/components/prototype/design-system';

interface Props {
  params: { locale: string };
}

export default function LandingPage({ params: { locale } }: Props) {
  const isRtl = locale === 'ar';
  const t = STRINGS[locale as 'ar' | 'en'];
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);

  // Animate counters on mount
  useEffect(() => {
    const animate = (target: number, setter: (val: number) => void, dur: number) => {
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 2.5);
        setter(Math.round(e * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 400);
    };
    animate(50, setCount1, 1600);
    animate(31, setCount2, 1400);
    animate(70, setCount3, 1800);
  }, []);

  const features = isRtl
    ? [
        {
          icon: '◈',
          title: 'درجة ثقة بالذكاء الاصطناعي',
          desc: 'كل عضو يحصل على درجة ثقة من 0 إلى 1000 محسوبة بخوارزمية ذكية تضمن أمان الجميع',
        },
        {
          icon: '◉',
          title: 'حساب ضمان آمن',
          desc: 'أموالك لا تُحوَّل مباشرة — بل تُودَع في حساب ضمان محمي وتُصرف تلقائياً في الموعد المحدد',
        },
        {
          icon: '◇',
          title: 'صندوق تأمين جماعي',
          desc: 'كل جمعية تُودِع نسبة صغيرة في صندوق تأمين مشترك يضمن عدم خسارة أي عضو حتى لو تخلّف أحدهم',
        },
      ]
    : [
        {
          icon: '◈',
          title: 'AI Trust Score',
          desc: 'Every member gets a 0–1000 trust score calculated by our smart algorithm — ensuring everyone is verified and accountable',
        },
        {
          icon: '◉',
          title: 'Smart Escrow',
          desc: 'Money is never transferred peer-to-peer — it sits in a protected escrow account and auto-releases on schedule',
        },
        {
          icon: '◇',
          title: 'Collective Insurance',
          desc: 'Every circle contributes a small % to a shared insurance fund that covers defaults — no one ever loses their savings',
        },
      ];

  const steps = isRtl
    ? [
        {
          n: '١',
          title: 'سجّل وتحقق',
          desc: 'تحقق من هويتك واحصل على درجة ثقتك الأولية خلال دقائق',
        },
        {
          n: '٢',
          title: 'انضم أو أنشئ',
          desc: 'اختر جمعية من السوق أو ادعُ أصدقاءك لبدء جمعية خاصة',
        },
        {
          n: '٣',
          title: 'ادّخر واستلم',
          desc: 'يتم الخصم تلقائياً كل شهر وتستلم دورك في الموعد المحدد',
        },
      ]
    : [
        {
          n: '1',
          title: 'Sign Up & Verify',
          desc: 'Verify your identity and get your initial trust score in minutes',
        },
        {
          n: '2',
          title: 'Join or Create',
          desc: 'Browse the marketplace or invite friends to start a private circle',
        },
        {
          n: '3',
          title: 'Save & Receive',
          desc: 'Monthly contributions are automatic — receive your payout on schedule',
        },
      ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: DS.colors.bg,
        fontFamily: 'inherit',
      }}
    >
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          background: DS.colors.navy,
          overflow: 'hidden',
          padding: '0 0 60px',
        }}
      >
        <GeoBg opacity={0.07} />
        {/* Nav */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: DS.colors.gold,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth={2.5}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span
              style={{
                color: '#fff',
                fontWeight: 800,
                fontSize: 17,
                letterSpacing: '-0.01em',
              }}
            >
              {t.appName}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href={isRtl ? '/en' : '/ar'}>
              <button
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: 'inherit',
                }}
              >
                {locale === 'ar' ? 'EN' : 'ع'}
              </button>
            </Link>
            <Link href={`/${locale}/(auth)/login`}>
              <AppButton variant="secondary" size="sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}>
                {t.signIn}
              </AppButton>
            </Link>
          </div>
        </div>

        {/* Hero Content */}
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px 20px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: `${DS.colors.gold}20`,
              border: `1px solid ${DS.colors.gold}40`,
              borderRadius: 999,
              padding: '4px 14px',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                color: DS.colors.gold,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {isRtl
                ? '✦ منصة الادخار الجماعي الذكية'
                : '✦ Smart Collective Savings Platform'}
            </span>
          </div>
          <h1
            style={{
              color: '#fff',
              fontSize: isRtl ? 'clamp(28px,7vw,52px)' : 'clamp(26px,6vw,48px)',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 16px',
              letterSpacing: '-0.02em',
            }}
          >
            {isRtl ? (
              <>
                الجمعية التقليدية
                <br />
                <span style={{ color: DS.colors.gold }}>بقوة الذكاء الاصطناعي</span>
              </>
            ) : (
              <>
                Traditional Savings Circles
                <br />
                <span style={{ color: DS.colors.gold }}>Powered by AI</span>
              </>
            )}
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 16,
              lineHeight: 1.7,
              maxWidth: 400,
              margin: '0 auto 32px',
            }}
          >
            {isRtl
              ? 'انضم إلى ملايين العرب الذين يدّخرون معاً — بأمان تام، وشفافية كاملة، وضمان ضد أي تقصير'
              : 'Join millions of Arabs saving together — fully secure, transparent, and protected against defaults'}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href={`/${locale}/(auth)/signup`}>
              <AppButton variant="gold" size="lg">
                {t.signUp}
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <polyline
                    points={
                      isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'
                    }
                  />
                </svg>
              </AppButton>
            </Link>
            <Link href={`/${locale}/(dashboard)/dashboard`}>
              <AppButton
                variant="secondary"
                size="lg"
                style={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                {isRtl ? 'شاهد العرض' : 'See Demo'}
              </AppButton>
            </Link>
          </div>
        </div>

        {/* Floating app preview */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 40,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 200,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.12)',
              padding: 16,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 11,
                }}
              >
                {isRtl ? 'درجة الثقة' : 'Trust Score'}
              </span>
              <TierBadge score={720} lang={locale as 'ar' | 'en'} />
            </div>
            <TrustGauge
              score={720}
              size={120}
              animated={true}
              showLabel={false}
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              {[200, 500, 300].map((a, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '6px 4px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      color: DS.colors.gold,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {a}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 9,
                    }}
                  >
                    {t.jod}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          background: DS.colors.card,
          borderBottom: `1px solid ${DS.colors.border}`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            maxWidth: 600,
            margin: '0 auto',
          }}
        >
          {[
            {
              val: `${count1}%`,
              label: isRtl
                ? 'من العرب يستخدمون الجمعيات'
                : 'of Arabs use savings circles',
            },
            {
              val: `$${count2}M`,
              label: isRtl
                ? 'تمويل MoneyFellows'
                : 'raised by MoneyFellows',
            },
            {
              val: `${count3}%`,
              label: isRtl
                ? 'من المستخدمين نساء'
                : 'of users are women',
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: '24px 12px',
                textAlign: 'center',
                borderInlineEnd:
                  i < 2 ? `1px solid ${DS.colors.border}` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: DS.colors.navy,
                  letterSpacing: '-0.02em',
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: DS.colors.muted,
                  marginTop: 4,
                  lineHeight: 1.4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div
        style={{
          padding: '48px 24px',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: DS.colors.navy,
              margin: '0 0 8px',
            }}
          >
            {isRtl ? 'ثلاثة أعمدة للثقة' : 'Three Pillars of Trust'}
          </h2>
          <p
            style={{
              color: DS.colors.muted,
              fontSize: 15,
            }}
          >
            {isRtl
              ? 'تقنية متطورة تحمي مدخراتك'
              : 'Advanced technology protecting your savings'}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <Card
              key={i}
              style={{
                padding: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: DS.colors.goldBg,
                  color: DS.colors.gold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: DS.colors.navy,
                    marginBottom: 4,
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: DS.colors.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {f.desc}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div
        style={{
          background: DS.colors.navy,
          padding: '48px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <GeoBg opacity={0.05} />
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <h2
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            {isRtl ? 'كيف يعمل النظام؟' : 'How It Works'}
          </h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: DS.colors.gold,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <div
                    style={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 4,
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: 500,
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: DS.colors.navy,
            marginBottom: 12,
          }}
        >
          {isRtl ? 'ابدأ رحلة الادخار اليوم' : 'Start Saving Together Today'}
        </h2>
        <p
          style={{
            color: DS.colors.muted,
            marginBottom: 28,
            fontSize: 15,
          }}
        >
          {isRtl
            ? 'انضم إلى آلاف الأسر العربية التي تدّخر بأمان'
            : 'Join thousands of Arab families saving safely'}
        </p>
        <Link href={`/${locale}/(auth)/signup`}>
          <AppButton variant="gold" size="lg" style={{ marginBottom: 12 }}>
            {t.signUp} — {isRtl ? 'مجاناً' : 'Free'}
          </AppButton>
        </Link>
        <div
          style={{
            fontSize: 12,
            color: DS.colors.muted,
            marginTop: 12,
          }}
        >
          {isRtl
            ? 'لا رسوم إنشاء · آمن ومرخّص · شريعة إسلامية'
            : 'No setup fees · Secure & licensed · Sharia-compliant'}
        </div>
      </div>
    </div>
  );
}