'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Loader2,
  LogOut,
  ShieldCheck,
  Trash2,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { DS } from '@/components/prototype/design-system';
import { Card } from '@/components/prototype/ui-library';
import useUser, { type Profile } from '@/hooks/useUser';

type Locale = 'ar' | 'en';

type ProfileResponse = {
  success: boolean;
  error?: string;
  profile?: Profile;
  avatar_url?: string;
};

type ProfileMeResponse = ProfileResponse & {
  user?: {
    id: string;
    email?: string;
  };
};

type AccountMetric = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
  bg: string;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'J';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function formatVerificationStatus(status: string | undefined, locale: Locale) {
  if (status === 'verified') return locale === 'ar' ? 'موثق' : 'Verified';
  if (status === 'pending') return locale === 'ar' ? 'قيد المراجعة' : 'Pending';
  return locale === 'ar' ? 'غير موثق' : 'Unverified';
}

function SettingSkeleton() {
  const block = (height: number, width = '100%') => (
    <div
      style={{
        width,
        height,
        borderRadius: 10,
        backgroundImage: 'linear-gradient(90deg, rgba(13,31,60,0.05) 25%, rgba(13,31,60,0.1) 50%, rgba(13,31,60,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'settings-shimmer 1.3s infinite',
      }}
    />
  );

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Card style={{ padding: 20 }}>{block(92)}</Card>
      <Card style={{ padding: 20, display: 'grid', gap: 12 }}>
        {block(16, '55%')}
        {block(46)}
        {block(46)}
      </Card>
      <Card style={{ padding: 20 }}>{block(130)}</Card>
    </div>
  );
}

export default function SettingsPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const isRtl = locale === 'ar';
  const router = useRouter();
  const t = useTranslations('settings');
  const { user, profile, loading, signOut } = useUser();
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [serverProfileLoading, setServerProfileLoading] = useState(true);
  const [serverEmail, setServerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
      setFullName(profile.full_name ?? '');
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);

    async function loadProfileFromServer() {
      try {
        const response = await fetch('/api/profile/me', {
          signal: controller.signal,
        });
        const payload = (await response.json()) as ProfileMeResponse;

        if (response.ok && payload.success && payload.profile) {
          setLocalProfile(payload.profile);
          setFullName(payload.profile.full_name ?? '');
          setServerEmail(payload.user?.email ?? null);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error loading settings profile:', error);
        }
      } finally {
        window.clearTimeout(timeoutId);
        setServerProfileLoading(false);
      }
    }

    void loadProfileFromServer();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingTimedOut(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setLoadingTimedOut(true), 7000);
    return () => window.clearTimeout(timeoutId);
  }, [loading]);

  const displayName = localProfile?.full_name || user?.email?.split('@')[0] || t('unknownUser');
  const avatarUrl = previewUrl ?? localProfile?.profile_image_url ?? null;
  const email = user?.email ?? serverEmail ?? t('notProvided');
  const phone = localProfile?.phone ?? t('notProvided');
  const walletBalance = Number(localProfile?.wallet_balance ?? 0).toLocaleString(locale);
  const trustScore = Number(localProfile?.trust_score ?? 0).toLocaleString(locale);

  const accountMetrics = useMemo<AccountMetric[]>(
    () => [
      {
        label: t('trustScore'),
        value: `${trustScore}/1000`,
        icon: ShieldCheck,
        tone: DS.colors.success,
        bg: DS.colors.successLight,
      },
      {
        label: t('tier'),
        value: localProfile?.tier ? t(localProfile.tier) : t('bronze'),
        icon: UserRound,
        tone: DS.colors.gold,
        bg: DS.colors.goldBg,
      },
      {
        label: t('walletBalance'),
        value: `${walletBalance} ${t('jod')}`,
        icon: Wallet,
        tone: DS.colors.navy,
        bg: DS.colors.mutedLight,
      },
      {
        label: t('verificationStatus'),
        value: formatVerificationStatus(localProfile?.verification_status, locale),
        icon: Check,
        tone: localProfile?.verification_status === 'verified' ? DS.colors.success : DS.colors.muted,
        bg: localProfile?.verification_status === 'verified' ? DS.colors.successLight : DS.colors.mutedLight,
      },
    ],
    [localProfile, locale, t, trustScore, walletBalance],
  );

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSaving(true);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      });
      const payload = (await response.json()) as ProfileResponse;

      if (!response.ok || !payload.success || !payload.profile) {
        throw new Error(payload.error ?? t('requestFailed'));
      }

      setLocalProfile(payload.profile);
      setFullName(payload.profile.full_name ?? '');
      setStatus({ kind: 'success', message: t('saved') });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : t('requestFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(null);
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextPreviewUrl;
    });
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const payload = (await response.json()) as ProfileResponse;

      if (!response.ok || !payload.success || !payload.profile) {
        throw new Error(payload.error ?? t('requestFailed'));
      }

      setLocalProfile(payload.profile);
      setStatus({ kind: 'success', message: t('photoSaved') });
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : t('requestFailed') });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSignOut = async () => {
    if (!window.confirm(t('signOutConfirm'))) return;
    await signOut();
  };

  if (!localProfile && serverProfileLoading && loading && !loadingTimedOut) {
    return (
      <main style={{ minHeight: '100vh', background: DS.colors.bg, paddingBottom: 90 }} dir={isRtl ? 'rtl' : 'ltr'}>
        <style>{`@keyframes settings-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        <div style={{ padding: '18px 16px', maxWidth: 560, margin: '0 auto' }}>
          <SettingSkeleton />
        </div>
      </main>
    );
  }

  if (!localProfile || (!user && !serverEmail)) {
    return (
      <main style={{ minHeight: '100vh', background: DS.colors.bg, padding: 16 }} dir={isRtl ? 'rtl' : 'ltr'}>
        <Card style={{ padding: 22, maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, color: DS.colors.navy, fontSize: 20, marginBottom: 8 }}>{t('settingsTitle')}</div>
          <div style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 18 }}>{t('signInRequired')}</div>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            style={{
              height: 44,
              border: 'none',
              borderRadius: 12,
              background: DS.colors.navy,
              color: '#fff',
              fontWeight: 800,
              padding: '0 22px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('signIn')}
          </button>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: DS.colors.bg, paddingBottom: 100 }} dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: DS.colors.card,
          borderBottom: `1px solid ${DS.colors.border}`,
          padding: '13px 16px',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            aria-label={t('back')}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: 'none',
              background: DS.colors.mutedLight,
              color: DS.colors.navy,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <div style={{ fontWeight: 900, color: DS.colors.navy, fontSize: 18 }}>{t('settingsTitle')}</div>
        </div>
      </div>

      <div style={{ padding: '18px 16px', maxWidth: 560, margin: '0 auto', display: 'grid', gap: 14 }}>
        <Card style={{ padding: 20, overflow: 'hidden', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 24,
                  background: avatarUrl ? `url("${avatarUrl}") center/cover` : DS.colors.goldBg,
                  border: `1.5px solid ${DS.colors.gold}44`,
                  color: DS.colors.gold,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 26,
                  fontWeight: 900,
                }}
              >
                {!avatarUrl ? initialsFromName(displayName) : null}
              </div>
              <label
                title={t('changePhoto')}
                style={{
                  position: 'absolute',
                  insetInlineEnd: -4,
                  bottom: -4,
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: DS.colors.navy,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: uploading ? 'wait' : 'pointer',
                  boxShadow: DS.shadow.md,
                }}
              >
                {uploading ? <Loader2 size={16} style={{ animation: 'settings-spin 1s linear infinite' }} /> : <Camera size={16} />}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarChange} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: DS.colors.navy, fontSize: 22, fontWeight: 900, overflowWrap: 'anywhere' }}>{displayName}</div>
              <div style={{ color: DS.colors.muted, fontSize: 13, marginTop: 5, overflowWrap: 'anywhere' }}>{phone}</div>
              <div style={{ color: DS.colors.muted, fontSize: 13, marginTop: 2, overflowWrap: 'anywhere' }}>{email}</div>
            </div>
          </div>
        </Card>

        {status ? (
          <div
            role="status"
            style={{
              borderRadius: 12,
              border: `1px solid ${status.kind === 'success' ? DS.colors.success : DS.colors.error}33`,
              background: status.kind === 'success' ? DS.colors.successLight : DS.colors.errorLight,
              color: status.kind === 'success' ? DS.colors.success : DS.colors.error,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {status.message}
          </div>
        ) : null}

        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: DS.colors.navy, fontSize: 16, marginBottom: 14 }}>{t('editProfile')}</div>
          <form onSubmit={handleProfileSave} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ color: DS.colors.muted, fontSize: 12, fontWeight: 800 }}>{t('fullName')}</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={t('fullName')}
                style={{
                  height: 46,
                  borderRadius: 12,
                  border: `1.5px solid ${DS.colors.borderStrong}`,
                  background: '#fff',
                  color: DS.colors.navy,
                  padding: '0 13px',
                  font: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ color: DS.colors.muted, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>{t('phone')}</div>
                <div style={{ minHeight: 44, borderRadius: 12, background: DS.colors.mutedLight, color: DS.colors.navy, padding: '12px 13px', fontWeight: 700, overflowWrap: 'anywhere' }}>{phone}</div>
              </div>
              <div>
                <div style={{ color: DS.colors.muted, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>{t('email')}</div>
                <div style={{ minHeight: 44, borderRadius: 12, background: DS.colors.mutedLight, color: DS.colors.navy, padding: '12px 13px', fontWeight: 700, overflowWrap: 'anywhere' }}>{email}</div>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || fullName.trim().length < 2}
              style={{
                height: 46,
                border: 'none',
                borderRadius: 12,
                background: DS.colors.gold,
                color: '#fff',
                fontFamily: 'inherit',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving || fullName.trim().length < 2 ? 0.6 : 1,
              }}
            >
              {saving ? <Loader2 size={16} style={{ animation: 'settings-spin 1s linear infinite' }} /> : <Check size={16} />}
              {saving ? t('saving') : t('save')}
            </button>
          </form>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: DS.colors.navy, fontSize: 16, marginBottom: 14 }}>{t('accountInfo')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {accountMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} style={{ borderRadius: 14, background: metric.bg, padding: 13, minHeight: 92 }}>
                  <Icon size={18} color={metric.tone} />
                  <div style={{ color: DS.colors.muted, fontSize: 11, fontWeight: 800, marginTop: 10 }}>{metric.label}</div>
                  <div style={{ color: DS.colors.navy, fontSize: 16, fontWeight: 900, marginTop: 3, overflowWrap: 'anywhere' }}>{metric.value}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 900, color: DS.colors.navy, fontSize: 16, marginBottom: 12 }}>{t('appPreferences')}</div>
          <button
            onClick={() => router.push(`/${isRtl ? 'en' : 'ar'}/settings`)}
            style={{
              width: '100%',
              border: `1px solid ${DS.colors.border}`,
              borderRadius: 14,
              background: '#fff',
              minHeight: 54,
              padding: '10px 13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: DS.colors.navy, fontWeight: 900 }}>
              <Globe2 size={18} color={DS.colors.gold} />
              {t('language')}
            </span>
            <span style={{ color: DS.colors.muted, fontWeight: 800 }}>{isRtl ? 'English' : 'العربية'}</span>
          </button>
        </Card>

        <Card style={{ padding: 20, borderColor: `${DS.colors.error}33`, background: '#fff' }}>
          <div style={{ fontWeight: 900, color: DS.colors.error, fontSize: 16, marginBottom: 12 }}>{t('dangerZone')}</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <button
              onClick={handleSignOut}
              style={{
                height: 48,
                border: 'none',
                borderRadius: 12,
                background: DS.colors.error,
                color: '#fff',
                fontFamily: 'inherit',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <LogOut size={17} />
              {t('signOut')}
            </button>
            <button
              disabled
              style={{
                height: 48,
                border: `1px solid ${DS.colors.error}22`,
                borderRadius: 12,
                background: DS.colors.errorLight,
                color: DS.colors.error,
                fontFamily: 'inherit',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: 0.55,
              }}
            >
              <Trash2 size={17} />
              {t('deleteAccount')}
            </button>
          </div>
        </Card>
      </div>
      <style>{`@keyframes settings-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
