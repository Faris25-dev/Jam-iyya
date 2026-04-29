'use client';

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const DS = {
  colors: {
    bg: '#F7F5F0',
    navy: '#0D1F3C',
    navyMid: '#1A3A6B',
    gold: '#C4963E',
    goldLight: '#F0DFA0',
    goldBg: '#FBF4E0',
    muted: '#6B7A99',
    mutedLight: '#E8EAF0',
    border: 'rgba(13,31,60,0.10)',
    error: '#B93B2B',
    errorLight: '#FBE9E7',
    success: '#1A7A50',
    successLight: '#E6F4EE',
    white: '#FFFFFF',
  },
};

type Step = 'phone' | 'otp';

export default function SignupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const isAr = locale === 'ar';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const t = {
    title: isAr ? 'إنشاء حساب' : 'Create Account',
    subtitle: isAr ? 'انضم إلى دوائر الادخار الذكية' : 'Join the smart savings circles',
    nameLabel: isAr ? 'الاسم الكامل' : 'Full Name',
    namePlaceholder: isAr ? 'محمد العبدالله' : 'John Smith',
    phoneLabel: isAr ? 'رقم الهاتف' : 'Phone Number',
    phonePlaceholder: isAr ? 'مثال: 791234567' : 'e.g. 791234567',
    sendOtp: isAr ? 'إرسال رمز التحقق' : 'Send Verification Code',
    otpTitle: isAr ? 'تحقق من هاتفك' : 'Verify Your Phone',
    otpSubtitle: isAr ? `أُرسل رمز مكوّن من 6 أرقام إلى` : 'A 6-digit code was sent to',
    verify: isAr ? 'تحقق وإنشاء الحساب' : 'Verify & Create Account',
    resend: isAr ? 'إعادة الإرسال' : 'Resend Code',
    hasAccount: isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?',
    signIn: isAr ? 'تسجيل الدخول' : 'Sign In',
    back: isAr ? 'رجوع' : 'Back',
    appName: isAr ? "جمعية AI" : "Jam'iyya AI",
    tagline: isAr ? 'دوائر الادخار الذكية' : 'Smart Savings Circles',
    terms: isAr ? 'بالتسجيل توافق على' : 'By signing up you agree to our',
    termsLink: isAr ? 'الشروط والأحكام' : 'Terms & Conditions',
  };

  const formattedPhone = phone ? `+962 ${phone}` : '';

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length < 7 || !name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+962${phone}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setStep('otp');
      setSuccess(isAr ? 'تم إرسال الرمز بنجاح!' : 'Code sent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+962${phone}`, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      // Redirect to dashboard after successful signup
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(val: string, idx: number) {
    const next = [...otp];
    next[idx] = val.replace(/\D/g, '').slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    if (text.length > 0) otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  const canSubmitPhone = phone.length >= 7 && name.trim().length >= 2;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${DS.colors.navy} 0%, ${DS.colors.navyMid} 50%, #0a3055 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${DS.colors.gold}22 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, ${DS.colors.navyMid}44 0%, transparent 70%)` }} />
      </div>

      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 28,
        boxShadow: '0 24px 80px rgba(13,31,60,0.30)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Top accent */}
        <div style={{ height: 5, background: `linear-gradient(90deg, ${DS.colors.gold}, ${DS.colors.goldLight}, ${DS.colors.gold})` }} />

        <div style={{ padding: '40px 40px 36px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, margin: '0 auto 14px',
              background: `linear-gradient(135deg, ${DS.colors.navy}, ${DS.colors.navyMid})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 24px ${DS.colors.navy}33`,
            }}>
              <span style={{ fontSize: 28 }}>◈</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: DS.colors.navy, letterSpacing: '-0.3px' }}>{t.appName}</div>
            <div style={{ fontSize: 12, color: DS.colors.muted, marginTop: 2 }}>{t.tagline}</div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: DS.colors.navy, margin: 0, letterSpacing: '-0.5px' }}>
              {step === 'phone' ? t.title : t.otpTitle}
            </h1>
            <p style={{ fontSize: 14, color: DS.colors.muted, margin: '6px 0 0' }}>
              {step === 'phone' ? t.subtitle : `${t.otpSubtitle} ${formattedPhone}`}
            </p>
          </div>

          {/* Step progress */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {['phone', 'otp'].map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: (step === 'phone' && i === 0) || step === 'otp' ? `linear-gradient(90deg, ${DS.colors.gold}, ${DS.colors.goldLight})` : DS.colors.mutedLight,
                transition: 'background 0.4s ease',
              }} />
            ))}
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{ background: DS.colors.errorLight, border: `1px solid ${DS.colors.error}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: DS.colors.error, fontSize: 13, fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background: DS.colors.successLight, border: `1px solid ${DS.colors.success}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: DS.colors.success, fontSize: 13, fontWeight: 500 }}>
              ✓ {success}
            </div>
          )}

          {/* PHONE STEP */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp}>
              {/* Name field */}
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: DS.colors.navy, marginBottom: 8 }}>
                {t.nameLabel}
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder={t.namePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12, marginBottom: 18,
                  border: `1.5px solid ${DS.colors.border}`, fontSize: 15,
                  color: DS.colors.navy, outline: 'none', background: DS.colors.white,
                  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = DS.colors.gold}
                onBlur={e => e.target.style.borderColor = DS.colors.border}
                required
              />

              {/* Phone field */}
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: DS.colors.navy, marginBottom: 8 }}>
                {t.phoneLabel}
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '0 14px',
                  background: DS.colors.mutedLight, borderRadius: 12, border: `1.5px solid ${DS.colors.border}`,
                  fontSize: 14, fontWeight: 700, color: DS.colors.navy, whiteSpace: 'nowrap',
                }}>
                  🇯🇴 +962
                </div>
                <input
                  id="signup-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 12,
                    border: `1.5px solid ${DS.colors.border}`, fontSize: 16,
                    color: DS.colors.navy, outline: 'none', background: DS.colors.white,
                    fontFamily: 'inherit', letterSpacing: '0.5px', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = DS.colors.gold}
                  onBlur={e => e.target.style.borderColor = DS.colors.border}
                  required
                />
              </div>

              <button
                id="signup-send-otp-btn"
                type="submit"
                disabled={loading || !canSubmitPhone}
                style={{
                  width: '100%', padding: '15px', borderRadius: 14,
                  background: !canSubmitPhone || loading
                    ? DS.colors.mutedLight
                    : `linear-gradient(135deg, ${DS.colors.gold}, #e8b04a)`,
                  color: !canSubmitPhone || loading ? DS.colors.muted : DS.colors.navy,
                  fontWeight: 700, fontSize: 15, border: 'none', cursor: !canSubmitPhone || loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: canSubmitPhone && !loading ? `0 4px 20px ${DS.colors.gold}44` : 'none',
                  letterSpacing: '0.3px',
                }}
              >
                {loading ? '...' : t.sendOtp}
              </button>

              {/* Terms */}
              <p style={{ textAlign: 'center', fontSize: 11, color: DS.colors.muted, marginTop: 14, lineHeight: 1.5 }}>
                {t.terms}{' '}
                <span style={{ color: DS.colors.gold, cursor: 'pointer', fontWeight: 600 }}>{t.termsLink}</span>
              </p>
            </form>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              {/* Name display */}
              <div style={{
                background: DS.colors.goldBg, borderRadius: 12, padding: '12px 16px',
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${DS.colors.gold}, #e8b04a)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: DS.colors.navy,
                }}>
                  {name.trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DS.colors.navy }}>{name}</div>
                  <div style={{ fontSize: 11, color: DS.colors.muted }}>{formattedPhone}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
                {otp.map((v, i) => (
                  <input
                    key={i}
                    id={`otp-signup-${i}`}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
                      borderRadius: 12, border: `2px solid ${v ? DS.colors.gold : DS.colors.border}`,
                      color: DS.colors.navy, outline: 'none', background: v ? DS.colors.goldBg : DS.colors.white,
                      transition: 'all 0.2s', fontFamily: 'monospace',
                    }}
                    onFocus={e => e.target.style.borderColor = DS.colors.gold}
                    onBlur={e => e.target.style.borderColor = v ? DS.colors.gold : DS.colors.border}
                  />
                ))}
              </div>

              <button
                id="signup-verify-btn"
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                style={{
                  width: '100%', padding: '15px', borderRadius: 14,
                  background: otp.join('').length !== 6 || loading
                    ? DS.colors.mutedLight
                    : `linear-gradient(135deg, ${DS.colors.gold}, #e8b04a)`,
                  color: otp.join('').length !== 6 || loading ? DS.colors.muted : DS.colors.navy,
                  fontWeight: 700, fontSize: 15, border: 'none', cursor: otp.join('').length !== 6 || loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: otp.join('').length === 6 && !loading ? `0 4px 20px ${DS.colors.gold}44` : 'none',
                  marginBottom: 12,
                }}
              >
                {loading ? '...' : t.verify}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}
                  style={{ background: 'none', border: 'none', color: DS.colors.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← {t.back}
                </button>
                <button type="button" onClick={handleSendOtp}
                  style={{ background: 'none', border: 'none', color: DS.colors.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t.resend}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 24, borderTop: `1px solid ${DS.colors.border}`, fontSize: 13, color: DS.colors.muted }}>
            {t.hasAccount}{' '}
            <Link href={`/${locale}/login`} style={{ color: DS.colors.gold, fontWeight: 700, textDecoration: 'none' }}>
              {t.signIn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}