'use client';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AppButton } from '@/components/prototype/ui-library';
import { DS } from '@/components/prototype/design-system';

type Locale = 'ar' | 'en';
const OTP_BYPASS = process.env.NODE_ENV !== 'production';

export default function LoginPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const isRtl = locale === 'ar';
  const t = useTranslations('signup');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = email.includes('@') && password.length >= 6;

  const handleLogin = async () => {
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string; code?: string };

      if (!response.ok || !payload.success) {
        // Check if phone verification is pending
        if (payload.code === 'PHONE_VERIFICATION_PENDING') {
          setErrorMessage(t('phoneVerificationPending'));
        } else {
          throw new Error(payload.error || t('requestFailed'));
        }
        return;
      }

      // Redirect to dashboard
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('requestFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) {
      handleLogin();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }} data-screen-label="Login">
      <div style={{ background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>{t('appName')}</span>
        </div>
        <button
          onClick={() => router.push(`/${isRtl ? 'en' : 'ar'}/login`)}
          style={{ background: DS.colors.mutedLight, border: 'none', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: DS.colors.navy, fontFamily: 'inherit' }}
        >
          {isRtl ? 'EN' : 'ع'}
        </button>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', maxWidth: 420, margin: '0 auto', width: '100%' }}>
        {OTP_BYPASS ? (
          <div style={{ background: DS.colors.goldBg, border: `1px solid ${DS.colors.gold}30`, color: DS.colors.navy, borderRadius: DS.radii.md, padding: '10px 12px', fontSize: 12, lineHeight: 1.5, marginBottom: 18 }}>
            {t('otpBypassNotice')}
          </div>
        ) : null}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{t('signIn')}</h2>
          <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>{t('signInSubtitle')}</p>

          {/* Email Field */}
          <label style={{ fontSize: 13, color: DS.colors.muted, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('email')}</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('emailPlaceholder')}
            type="email"
            onKeyPress={handleKeyPress}
            style={{ background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none', marginBottom: 18 }}
          />

          {/* Password Field */}
          <label style={{ fontSize: 13, color: DS.colors.muted, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('password')}</label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('passwordPlaceholder')}
            type="password"
            onKeyPress={handleKeyPress}
            style={{ background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none', marginBottom: 24 }}
          />

          {errorMessage ? (
            <div style={{ background: DS.colors.errorLight, color: DS.colors.error, borderRadius: DS.radii.md, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>
              {errorMessage}
            </div>
          ) : null}

          <AppButton
            variant="primary"
            size="lg"
            onClick={handleLogin}
            disabled={!canSubmit || isLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isLoading ? t('signingIn') : t('signIn')}
          </AppButton>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: DS.colors.muted }}>
            {t('noAccount')} {' '}
            <button
              onClick={() => router.push(`/${locale}/signup`)}
              style={{ background: 'none', border: 'none', color: DS.colors.navy, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
            >
              {t('signUp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}