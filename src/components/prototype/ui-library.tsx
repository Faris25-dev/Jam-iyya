'use client';

import React, { CSSProperties, ReactNode, useState } from 'react';
import { DS, STRINGS, THEME_MAP } from './design-system';
import type { Jam, JamMember } from './mock-data';

// ===== Geometric Pattern =====
export function GeoBg({ opacity = 0.035 }: { opacity?: number }) {
  const pat = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M28 4L52 28L28 52L4 28Z' fill='none' stroke='%23C4963E' stroke-width='0.7'/%3E%3Ccircle cx='28' cy='28' r='5' fill='none' stroke='%23C4963E' stroke-width='0.7'/%3E%3Cline x1='28' y1='4' x2='28' y2='10' stroke='%23C4963E' stroke-width='0.7'/%3E%3Cline x1='52' y1='28' x2='46' y2='28' stroke='%23C4963E' stroke-width='0.7'/%3E%3Cline x1='28' y1='52' x2='28' y2='46' stroke='%23C4963E' stroke-width='0.7'/%3E%3Cline x1='4' y1='28' x2='10' y2='28' stroke='%23C4963E' stroke-width='0.7'/%3E%3C/svg%3E")`;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        backgroundImage: pat,
        backgroundSize: '56px 56px',
      }}
    />
  );
}

// ===== Button =====
interface AppButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
}

export function AppButton({
  children,
  variant = 'primary',
  onClick,
  disabled,
  style,
  size = 'md',
  type = 'button',
}: AppButtonProps) {
  const [hov, setHov] = useState(false);
  const sizes: Record<string, CSSProperties> = {
    sm: { padding: '7px 16px', fontSize: 13 },
    md: { padding: '11px 24px', fontSize: 15 },
    lg: { padding: '15px 36px', fontSize: 17 },
  };
  const base: CSSProperties = {
    borderRadius: DS.radii.md,
    fontFamily: 'inherit',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: 'none',
    outline: 'none',
  };
  const vars: Record<string, CSSProperties> = {
    primary: { background: hov ? DS.colors.navyMid : DS.colors.navy, color: '#fff' },
    gold: { background: hov ? '#b8852e' : DS.colors.gold, color: '#fff', boxShadow: hov ? DS.shadow.gold : 'none' },
    secondary: { background: hov ? DS.colors.mutedLight : 'transparent', color: DS.colors.navy, border: `1.5px solid ${DS.colors.borderStrong}` },
    ghost: { background: hov ? DS.colors.mutedLight : 'transparent', color: DS.colors.navy },
    danger: { background: hov ? '#a03020' : DS.colors.error, color: '#fff' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, ...sizes[size], ...vars[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ===== Card =====
interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, style, onClick, hover = false }: CardProps) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      onClick={onClick}
      style={{
        background: DS.colors.card,
        borderRadius: DS.radii.lg,
        border: `1px solid ${DS.colors.border}`,
        boxShadow: hov ? DS.shadow.lg : DS.shadow.sm,
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ===== Tier Badge =====
interface TierBadgeProps {
  score: number;
  lang: 'ar' | 'en';
  size?: 'sm' | 'md';
}

export function TierBadge({ score, lang, size = 'sm' }: TierBadgeProps) {
  const tier = DS.getTier(score);
  const t = DS.tiers[tier];
  const fs = size === 'sm' ? 11 : 13;
  return (
    <span
      style={{
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.color}40`,
        borderRadius: 999,
        padding: size === 'sm' ? '2px 10px' : '4px 14px',
        fontSize: fs,
        fontWeight: 700,
      }}
    >
      {lang === 'ar' ? t.ar : t.en}
    </span>
  );
}

// ===== Trust Gauge =====
interface TrustGaugeProps {
  score: number;
  size?: number;
  animated?: boolean;
  showLabel?: boolean;
}

export function TrustGauge({ score, size = 180, animated = true, showLabel = true }: TrustGaugeProps) {
  const [disp, setDisp] = useState(animated ? 0 : score);
  React.useEffect(() => {
    if (!animated) {
      setDisp(score);
      return;
    }
    const dur = 2000,
      start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(e * score));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [score, animated]);

  const tier = DS.getTier(disp);
  const t = DS.tiers[tier];
  const r = size * 0.38,
    circ = 2 * Math.PI * r,
    arc = 0.75;
  const dash = circ * arc,
    offset = dash * (1 - disp / 1000);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)', display: 'block' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={DS.colors.mutedLight}
          strokeWidth={size * 0.055}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.color}
          strokeWidth={size * 0.055}
          strokeDasharray={`${Math.max(0, dash - offset)} ${circ - Math.max(0, dash - offset)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.08s linear' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color: DS.colors.navy, lineHeight: 1 }}>{disp}</div>
        {showLabel && (
          <div style={{ fontSize: size * 0.085, color: t.color, fontWeight: 700, marginTop: 3 }}>{t.ar}</div>
        )}
        <div style={{ fontSize: size * 0.065, color: DS.colors.muted, marginTop: 2 }}>/ 1000</div>
      </div>
    </div>
  );
}

// ===== Jam'iyya Wheel =====
interface JamiyyaWheelProps {
  jam: Jam;
  lang: 'ar' | 'en';
  size?: number;
}

export function JamiyyaWheel({ jam, lang, size = 300 }: JamiyyaWheelProps) {
  const { members, currentMonth } = jam;
  const cx = size / 2,
    cy = size / 2,
    R = size * 0.37,
    avR = size * 0.07;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {members.map((m: JamMember, i: number) => {
        const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + R * Math.cos(angle),
          y = cy + R * Math.sin(angle);
        return <line key={`s${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={DS.colors.border} strokeWidth={1} />;
      })}
      {/* Center */}
      <circle cx={cx} cy={cy} r={size * 0.115} fill={DS.colors.goldBg} stroke={DS.colors.gold} strokeWidth={1.5} />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize={size * 0.055}
        fontWeight={800}
        fill={DS.colors.navy}
      >
        {currentMonth}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={size * 0.03} fill={DS.colors.muted}>
        {lang === 'ar' ? 'الشهر' : 'Month'}
      </text>

      {members.map((m: JamMember, i: number) => {
        const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + R * Math.cos(angle),
          y = cy + R * Math.sin(angle);
        const isActive = m.turn === currentMonth + 1;
        const isPast = m.turn <= currentMonth;
        const fill = m.isYou ? DS.colors.navy : isPast ? DS.colors.successLight : isActive ? DS.colors.gold : DS.colors.card;
        const stroke = m.isYou ? DS.colors.navy : isActive ? DS.colors.gold : m.isLate ? DS.colors.error : DS.colors.border;
        const sw = m.isYou || isActive || m.isLate ? 2.5 : 1;
        const textCol = m.isYou || isActive ? '#fff' : isPast ? DS.colors.success : DS.colors.navy;
        const label = lang === 'ar' ? m.initials : (m.nameEn || '').substring(0, 2);

        return (
          <g key={`m${i}`}>
            {isActive && (
              <circle cx={x} cy={y} r={avR * 1.6} fill={DS.colors.gold} opacity={0.12} />
            )}
            {isActive && (
              <circle cx={x} cy={y} r={avR * 2.0} fill={DS.colors.gold} opacity={0.06} />
            )}
            <circle cx={x} cy={y} r={avR} fill={fill} stroke={stroke} strokeWidth={sw} />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={avR * 0.72}
              fontWeight={700}
              fill={textCol}
            >
              {label}
            </text>
            <text
              x={x}
              y={y + avR + 9}
              textAnchor="middle"
              fontSize={avR * 0.55}
              fill={isPast ? DS.colors.success : DS.colors.muted}
              fontWeight={isPast ? 600 : 400}
            >
              {m.turn}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ===== Progress Bar =====
interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, max, color = DS.colors.gold, height = 6 }: ProgressBarProps) {
  return (
    <div style={{ background: DS.colors.mutedLight, borderRadius: 999, height, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          background: color,
          height: '100%',
          borderRadius: 999,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
}

// ===== Jam Card =====
interface JamCardProps {
  jam: Jam;
  lang: 'ar' | 'en';
  onClick?: () => void;
  showJoin?: boolean;
  onJoin?: (jam: Jam) => void;
}

export function JamCard({ jam, lang, onClick, showJoin, onJoin }: JamCardProps) {
  const t = STRINGS[lang];
  const tier = DS.getTier(jam.minScore || 0);
  const tData = DS.tiers[tier];
  const th = THEME_MAP[jam.theme as keyof typeof THEME_MAP] || {
    bg: DS.colors.card,
    icon: '◎',
    color: DS.colors.navy,
  };
  const isRtl = lang === 'ar';

  return (
    <Card hover onClick={onClick} style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [isRtl ? 'right' : 'left']: 0,
          width: 3.5,
          background: tData.color,
          borderRadius: isRtl ? '0 4px 4px 0' : '4px 0 0 4px',
        }}
      />
      <div style={{ paddingInlineStart: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: th.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: th.color,
              }}
            >
              {th.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: DS.colors.navy }}>
                {isRtl ? jam.nameAr : jam.nameEn}
              </div>
              <div style={{ fontSize: 12, color: DS.colors.muted, marginTop: 2 }}>
                {jam.totalMembers} {t.members} · {jam.duration} {t.month}
                {!isRtl && jam.duration > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div style={{ textAlign: isRtl ? 'start' : 'end', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: DS.colors.navy, lineHeight: 1 }}>
              {jam.amount}
            </div>
            <div style={{ fontSize: 11, color: DS.colors.muted }}>
              {t.jod}
              {t.monthly}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <TierBadge score={jam.minScore || 0} lang={lang} />
            {jam.status === 'recruiting' && jam.slots && jam.slots > 0 && (
              <span
                style={{
                  background: DS.colors.successLight,
                  color: DS.colors.success,
                  borderRadius: 999,
                  padding: '2px 9px',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {jam.slots} {t.slots}
              </span>
            )}
          </div>
          {showJoin && (
            <AppButton
              variant="gold"
              size="sm"
              onClick={() => {
                onJoin?.(jam);
              }}
            >
              {t.join}
            </AppButton>
          )}
        </div>
        {jam.status === 'active' && jam.currentMonth > 0 && (
          <div style={{ marginTop: 12 }}>
            <ProgressBar value={jam.currentMonth} max={jam.duration} color={tData.color} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: DS.colors.muted }}>
              <span>{isRtl ? `الشهر ${jam.currentMonth}` : `Month ${jam.currentMonth}`}</span>
              <span>{isRtl ? `من ${jam.duration}` : `of ${jam.duration}`}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ===== Navigation Bar =====
interface NavBarProps {
  screen: string;
  setScreen: (screen: string) => void;
  lang: 'ar' | 'en';
}

export function NavBar({ screen, setScreen, lang }: NavBarProps) {
  const items = [
    {
      id: 'dashboard',
      ar: 'الرئيسية',
      en: 'Home',
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? DS.colors.navy : 'none'} stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'marketplace',
      ar: 'السوق',
      en: 'Market',
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    { id: 'create', ar: '', en: '', icon: () => null },
    {
      id: 'detail',
      ar: 'جمعياتي',
      en: 'Circles',
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'payment',
      ar: 'الصرف',
      en: 'Payout',
      icon: (active: boolean) => (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.gold : DS.colors.muted} strokeWidth={2}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: DS.colors.card,
        borderTop: `1px solid ${DS.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 0 18px',
        boxShadow: '0 -4px 24px rgba(13,31,60,0.08)',
      }}
    >
      {items.map((item) => {
        if (item.id === 'create') {
          return (
            <button
              key="create"
              onClick={() => setScreen('create')}
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: DS.colors.navy,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: DS.shadow.md,
                transform: 'translateY(-8px)',
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          );
        }
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? DS.colors.navy : DS.colors.muted,
              fontFamily: 'inherit',
              fontSize: 10,
              fontWeight: active ? 700 : 400,
              padding: '4px 8px',
              minWidth: 50,
            }}
          >
            {item.icon(active)}
            <span>{lang === 'ar' ? item.ar : item.en}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ===== Top Bar =====
interface TopBarProps {
  title: string;
  onBack?: () => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  right?: ReactNode;
}

export function TopBar({ title, onBack, lang, setLang, right }: TopBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 16px',
        background: DS.colors.card,
        borderBottom: `1px solid ${DS.colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: DS.colors.mutedLight,
              border: 'none',
              borderRadius: 10,
              width: 34,
              height: 34,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: DS.colors.navy,
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points={lang === 'ar' ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
            </svg>
          </button>
        )}
        <span style={{ fontWeight: 800, fontSize: 17, color: DS.colors.navy }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {right}
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
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
          {lang === 'ar' ? 'EN' : 'ع'}
        </button>
      </div>
    </div>
  );
}
