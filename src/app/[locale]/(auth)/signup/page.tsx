'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AppButton, TrustGauge } from '@/components/prototype/ui-library';
import { DS } from '@/components/prototype/design-system';

type Locale = 'ar' | 'en';
type Step = 0 | 1 | 2 | 3;
const OTP_LENGTH = 6;
const OTP_BYPASS = process.env.NODE_ENV !== 'production';

function normalizeJordanPhone(input: string) {
  let digits = input.replace(/\D/g, '');

  if (digits.startsWith('962')) {
    digits = digits.slice(3);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length !== 9 || !digits.startsWith('7')) {
    return null;
  }

  return `+962${digits}`;
}

export default function SignupPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const isRtl = locale === 'ar';
  const t = useTranslations('signup');
  const router = useRouter();

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const [calcStep, setCalcStep] = useState(0);
  const [revealScore, setRevealScore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState(0);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const calcSteps = useMemo(
    () => [
      t('calcVerifyIdentity'),
      t('calcFaceAnalysis'),
      t('calcFinancialHistory'),
      t('calcTrustFactors'),
      t('calcBuildProfile'),
    ],
    [t]
  );

  useEffect(() => {
    if (step === 2) {
      let index = 0;
      const interval = setInterval(() => {
        setCalcStep(index);
        index += 1;
        if (index >= calcSteps.length) {
          clearInterval(interval);
          setTimeout(() => setStep(3), 600);
        }
      }, 600);
      return () => clearInterval(interval);
    }

    if (step === 3) {
      const timeout = setTimeout(() => setRevealScore(true), 300);
      return () => clearTimeout(timeout);
    }
  }, [step, calcSteps.length]);

  const canSubmitForm = name.trim() && email.includes('@') && password.length >= 6 && phone.replace(/\D/g, '').length >= 8;
  const canSubmitOtp = otp.every((digit) => digit.length === 1);

  const submitForm = async () => {
    if (!canSubmitForm || isSubmitting) return;

    const formattedPhone = normalizeJordanPhone(phone);
    if (!formattedPhone) {
      setErrorMessage(t('phoneFormatError'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: formattedPhone,
        }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || t('requestFailed'));
      }

      if (OTP_BYPASS) {
        setStep(2);
        setFinalScore(320);
      } else {
        setStep(1);
        setTimeout(() => otpRefs.current[0]?.focus(), 60);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('requestFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOtp = async (manualToken?: string) => {
    if (isVerifyingOtp) return;

    const formattedPhone = normalizeJordanPhone(phone);
    if (!formattedPhone) {
      setErrorMessage(t('phoneFormatError'));
      return;
    }

    const token = manualToken ?? otp.join('');
    if (token.length !== OTP_LENGTH) return;

    setIsVerifyingOtp(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, token }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string; user?: { profile?: { trust_score?: number } } };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || t('requestFailed'));
      }

      // Extract the trust score from the response
      const score = payload.user?.profile?.trust_score || 320;
      setFinalScore(score);
      setStep(2);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('requestFailed'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const next = [...otp];
    next[index] = value.replace(/\D/g, '').slice(-1);
    setOtp(next);

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    if (next.every((digit) => digit)) {
      void submitOtp(next.join(''));
    }
  };

  const steps = [
    { label: t('stepAccount') },
    { label: t('stepVerify') },
    { label: t('stepScore') },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }} data-screen-label="Signup">
      <div style={{ background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>{t('appName')}</span>
        </div>
        <button
          onClick={() => router.push(`/${isRtl ? 'en' : 'ar'}/signup`)}
          style={{ background: DS.colors.mutedLight, border: 'none', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: DS.colors.navy, fontFamily: 'inherit' }}
        >
          {isRtl ? 'EN' : 'ع'}
        </button>
      </div>

      {step < 2 && (
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((item, index) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', flex: index < steps.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: step >= index ? DS.colors.navy : DS.colors.mutedLight, color: step >= index ? '#fff' : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, transition: 'all 0.3s' }}>
                    {step > index ? '✓' : index + 1}
                  </div>
                  <span style={{ fontSize: 10, color: step >= index ? DS.colors.navy : DS.colors.muted, fontWeight: step === index ? 700 : 400 }}>{item.label}</span>
                </div>
                {index < steps.length - 1 && <div style={{ flex: 1, height: 2, background: step > index ? DS.colors.navy : DS.colors.mutedLight, margin: '0 4px', marginBottom: 18 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', maxWidth: 420, margin: '0 auto', width: '100%' }}>
        {OTP_BYPASS ? (
          <div style={{ background: DS.colors.goldBg, border: `1px solid ${DS.colors.gold}30`, color: DS.colors.navy, borderRadius: DS.radii.md, padding: '10px 12px', fontSize: 12, lineHeight: 1.5, marginBottom: 18 }}>
            {t('otpBypassNotice')}
          </div>
        ) : null}

        {step === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{t('createAccount')}</h2>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{t('createAccountSubtitle')}</p>

            {/* Name Field */}
            <label style={{ fontSize: 13, color: DS.colors.muted, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('fullName')}</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('fullNamePlaceholder')}
              style={{ background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none', marginBottom: 18 }}
            />

            {/* Email Field */}
            <label style={{ fontSize: 13, color: DS.colors.muted, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('email')}</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('emailPlaceholder')}
              type="email"
              style={{ background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none', marginBottom: 18 }}
            />

            {/* Password Field */}
            <label style={{ fontSize: 13, color: DS.colors.muted, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('password')}</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('passwordPlaceholder')}
              type="password"
              style={{ background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none', marginBottom: 18 }}
            />

            {/* Phone Field */}
            <label style={{ fontSize: 13, color: DS.colors.muted, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('phoneNumber')}</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ background: DS.colors.mutedLight, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontWeight: 600, color: DS.colors.navy, flexShrink: 0 }}>+962</div>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t('phonePlaceholder')}
                inputMode="numeric"
                style={{ flex: 1, background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none' }}
              />
            </div>

            <div style={{ fontSize: 12, color: DS.colors.muted, marginTop: -12, marginBottom: 18, lineHeight: 1.5 }}>
              {t('phoneFormatHelp')}
            </div>

            {errorMessage ? <div style={{ background: DS.colors.errorLight, color: DS.colors.error, borderRadius: DS.radii.md, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>{errorMessage}</div> : null}

            <AppButton variant="primary" size="lg" onClick={submitForm} disabled={!canSubmitForm || isSubmitting} style={{ width: '100%', justifyContent: 'center' }}>
              {isSubmitting ? t('creatingAccount') : t('continue')}
            </AppButton>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: DS.colors.muted }}>
              {t('haveAccount')} {' '}
              <button onClick={() => router.push(`/${locale}/login`)} style={{ background: 'none', border: 'none', color: DS.colors.navy, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                {t('signIn')}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{t('verificationCode')}</h2>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
              {t('enterOtp')} <strong style={{ color: DS.colors.navy }}>+962 {phone}</strong>
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, direction: 'ltr' }}>
              {otp.map((digit, index) => (
                <input
                  key={`otp-${index}`}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  value={digit}
                  maxLength={1}
                  onChange={(event) => handleOtpChange(event.target.value, index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && !otp[index] && index > 0) {
                      otpRefs.current[index - 1]?.focus();
                    }
                  }}
                  style={{ width: 46, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800, border: `2px solid ${digit ? DS.colors.navy : DS.colors.border}`, borderRadius: DS.radii.md, background: DS.colors.card, color: DS.colors.navy, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' }}
                />
              ))}
            </div>

            {errorMessage ? <div style={{ background: DS.colors.errorLight, color: DS.colors.error, borderRadius: DS.radii.md, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>{errorMessage}</div> : null}

            <AppButton variant="primary" size="lg" onClick={() => void submitOtp()} disabled={!canSubmitOtp || isVerifyingOtp} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
              {isVerifyingOtp ? t('verifyingCode') : t('continue')}
            </AppButton>

            <AppButton variant="ghost" size="md" onClick={submitForm} style={{ justifyContent: 'center', color: DS.colors.muted }}>
              {t('resendCode')}
            </AppButton>
          </div>
        )}

        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: DS.colors.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, fontSize: 32, position: 'relative' }}>
              <span style={{ color: DS.colors.gold }}>◈</span>
              <div style={{ position: 'absolute', inset: -4, borderRadius: 28, border: `2px solid ${DS.colors.gold}40`, animation: 'spin 2s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{t('calculating')}</h2>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 32 }}>{t('calculatingSubtitle')}</p>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {calcSteps.map((item, index) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: DS.radii.md, background: calcStep >= index ? DS.colors.successLight : DS.colors.mutedLight }}>
                  <div style={{ width: 20, height: 20, borderRadius: 999, background: calcStep > index ? DS.colors.success : calcStep === index ? DS.colors.gold : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {calcStep > index ? <span style={{ color: '#fff', fontSize: 10 }}>✓</span> : calcStep === index ? <div style={{ width: 8, height: 8, borderRadius: 999, background: '#fff', animation: 'pulse 1s infinite' }} /> : null}
                  </div>
                  <span style={{ fontSize: 13, color: calcStep >= index ? DS.colors.success : DS.colors.muted, fontWeight: calcStep === index ? 700 : 400 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ background: DS.colors.goldBg, color: DS.colors.gold, borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>✦ {t('scoreReveal')}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.colors.navy, margin: '16px 0 28px' }}>{t('congratsScore')}</h2>

            {revealScore ? <TrustGauge score={finalScore} size={200} animated showLabel /> : null}

            <div style={{ marginTop: 28, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: t('identityVerification'), pts: '+200', done: true },
                { label: t('selfieMatch'), pts: '+100', done: true },
                { label: t('phoneAge'), pts: '+20', done: true },
                { label: t('bankLink'), pts: '+150', done: false },
                { label: t('verifiedIncome'), pts: '+100', done: false },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: DS.radii.md, background: item.done ? DS.colors.successLight : DS.colors.mutedLight }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14 }}>{item.done ? '✓' : '○'}</span>
                    <span style={{ fontSize: 13, color: item.done ? DS.colors.success : DS.colors.muted, fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.done ? DS.colors.success : DS.colors.muted }}>{item.pts}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, padding: '12px 16px', background: DS.colors.goldBg, borderRadius: DS.radii.md, width: '100%', textAlign: 'start' }}>
              <div style={{ fontSize: 12, color: DS.colors.gold, fontWeight: 700, marginBottom: 4 }}>{t('raiseScoreTitle')}</div>
              <div style={{ fontSize: 12, color: DS.colors.muted, lineHeight: 1.5 }}>{t('raiseScoreBody')}</div>
            </div>

            <AppButton variant="gold" size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }} onClick={() => router.push(`/${locale}/dashboard`)}>
              {t('goToDashboard')}
            </AppButton>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}