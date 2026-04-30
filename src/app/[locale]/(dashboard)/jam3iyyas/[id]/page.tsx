'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Card, JamiyyaWheel, AppButton, TopBar } from '@/components/prototype/ui-library';
import { type ChatMessage, type Jam, type JamMember } from '@/components/prototype/mock-data';
import { DS } from '@/components/prototype/design-system';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Locale = 'ar' | 'en';
type DetailTab = 'wheel' | 'timeline' | 'chat';

type PaymentRecord = {
  user_id: string;
  month_number: number;
  status: 'paid' | 'late' | 'defaulted' | 'covered_by_insurance' | 'pending';
  amount: number;
  paid_date: string | null;
};

interface CircleApiResponse {
  jam3iyya: {
    id: string;
    name: string;
    description?: string;
    monthly_amount: number;
    total_members: number;
    duration_months: number;
    status: string;
    type: string;
    min_trust_score: number;
    current_month: number;
    insurance_pool: number;
    creator_id: string;
    is_current_user_member: boolean;
    is_current_user_creator: boolean;
    current_user_member_data?: { user_id: string; turn_number: number | null };
    members: Array<{
      user_id: string;
      turn_number: number | null;
      has_received: boolean;
      total_paid: number;
      status: string;
      profiles: { full_name: string };
    }>;
    payments: PaymentRecord[];
  };
}

function createInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function paymentStatusColor(status: PaymentRecord['status']) {
  switch (status) {
    case 'paid': return DS.colors.success;
    case 'covered_by_insurance': return '#3B82F6';
    case 'late': return DS.colors.error;
    case 'defaulted': return DS.colors.error;
    default: return DS.colors.muted;
  }
}

function paymentStatusBg(status: PaymentRecord['status']) {
  switch (status) {
    case 'paid': return DS.colors.successLight;
    case 'covered_by_insurance': return '#EFF6FF';
    case 'late': return DS.colors.errorLight;
    case 'defaulted': return DS.colors.errorLight;
    default: return DS.colors.mutedLight;
  }
}

function paymentStatusLabel(status: PaymentRecord['status'], isRtl: boolean) {
  const labels: Record<PaymentRecord['status'], { ar: string; en: string }> = {
    paid: { ar: 'دفع ✓', en: 'Paid ✓' },
    covered_by_insurance: { ar: 'تأمين 🛡', en: 'Insured 🛡' },
    late: { ar: 'متأخر', en: 'Late' },
    defaulted: { ar: 'متعثر', en: 'Defaulted' },
    pending: { ar: 'معلق', en: 'Pending' },
  };
  return isRtl ? labels[status].ar : labels[status].en;
}

export default function Jam3iyyaDetailPage() {
  const params = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const locale = (params?.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('detail');
  const isRtl = locale === 'ar';
  const circleId = params?.id as string;

  const [jam, setJam] = useState<Jam | null>(null);
  const [rawCircle, setRawCircle] = useState<CircleApiResponse['jam3iyya'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('wheel');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [wheelSize, setWheelSize] = useState(320);
  const [cycleRunning, setCycleRunning] = useState(false);
  const [cycleToast, setCycleToast] = useState<string | null>(null);

  const fetchCircle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/jam3iyyas/${circleId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch circle: ${response.statusText}`);
      }

      const data: CircleApiResponse = await response.json();
      const apiCircle = data.jam3iyya;
      const currentUserId = apiCircle.current_user_member_data?.user_id;

      if (!apiCircle.members) {
        throw new Error('No members returned');
      }

      // Build per-member payment status for the current month
      const currentMonth = apiCircle.current_month || 1;
      const paymentsThisMonth = (apiCircle.payments ?? []).filter(
        (p) => p.month_number === currentMonth,
      );
      const paymentByUser = new Map(paymentsThisMonth.map((p) => [p.user_id, p]));

      const transformedMembers: JamMember[] = apiCircle.members.map((member, index) => {
        const fullName = member.profiles?.full_name || 'Unknown';
        const payment = paymentByUser.get(member.user_id);
        const paymentStatus = payment?.status ?? 'pending';
        return {
          nameAr: fullName,
          nameEn: fullName,
          turn: member.turn_number || index + 1,
          paid: paymentStatus === 'paid' || paymentStatus === 'covered_by_insurance',
          received: member.has_received,
          initials: member.profiles?.full_name ? createInitials(member.profiles.full_name) : '?',
          isYou: !!currentUserId && member.user_id === currentUserId,
          isLate: paymentStatus === 'late' || paymentStatus === 'defaulted',
        };
      });

      const yourMember = transformedMembers.find((m) => m.isYou);

      const transformedJam: Jam = {
        id: apiCircle.id,
        nameAr: apiCircle.name,
        nameEn: apiCircle.name,
        amount: apiCircle.monthly_amount,
        totalMembers: apiCircle.total_members,
        duration: apiCircle.duration_months,
        minScore: apiCircle.min_trust_score || 0,
        type: apiCircle.type as 'public' | 'private' | 'semi_public',
        theme: 'default',
        currentMonth,
        yourTurn: yourMember?.turn || 1,
        status: apiCircle.status as 'recruiting' | 'active' | 'completed' | 'cancelled',
        avgScore: apiCircle.min_trust_score || 0,
        organizerAr: 'منظم الجمعية',
        organizerEn: 'Circle Organizer',
        descriptionAr: apiCircle.description || '',
        descriptionEn: apiCircle.description || '',
        // Use real insurance_pool from DB, not a computed estimate
        insuranceFund: apiCircle.insurance_pool ?? 0,
        totalPot: apiCircle.monthly_amount * apiCircle.total_members,
        members: transformedMembers,
      };

      setJam(transformedJam);
      setRawCircle(apiCircle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setJam(null);
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchCircle();
  }, [fetchCircle]);

  useEffect(() => {
    async function fetchChatHistory() {
      try {
        const response = await fetch(`/api/ai/chat?jam3iyyaId=${circleId}`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.messages && Array.isArray(payload.messages)) {
            const loadedMessages: ChatMessage[] = payload.messages.map((m: any, idx: number) => {
              const isAssistant = m.role === 'assistant';
              return {
                id: idx + 1,
                senderAr: isAssistant ? '✦ مساعد ذكي' : 'أنت',
                senderEn: isAssistant ? '✦ AI Assistant' : 'You',
                textAr: m.content,
                textEn: m.content,
                time: new Date(m.created_at).toLocaleTimeString('en', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }),
                isAI: isAssistant,
                isYou: !isAssistant,
              };
            });
            setMessages(loadedMessages);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    }
    fetchChatHistory();
  }, [circleId]);

  useEffect(() => {
    const updateSize = () => setWheelSize(Math.min(window.innerWidth - 32, 320));
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleRunCycle = async () => {
    if (cycleRunning) return;
    setCycleRunning(true);
    setCycleToast(null);
    try {
      const res = await fetch(`/api/jam3iyyas/${circleId}/run-cycle`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setCycleToast(data.error || 'Failed to run cycle');
      } else {
        const msg = isRtl
          ? `✓ تمت معالجة الشهر ${data.month} — ${data.pot_amount} د.أ لـ ${data.turn_holder?.name || '–'}`
          : `✓ Month ${data.month} processed — ${data.pot_amount} JOD to ${data.turn_holder?.name || '–'}`;
        setCycleToast(msg);
        await fetchCircle();
      }
    } catch (err) {
      setCycleToast('Network error running cycle');
    } finally {
      setCycleRunning(false);
      setTimeout(() => setCycleToast(null), 6000);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${DS.colors.border}`, borderTopColor: DS.colors.navy, animation: 'spin 1s linear infinite' }} />
        <div style={{ color: DS.colors.muted, fontSize: 14 }}>Loading circle...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !jam) {
    return (
      <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          title="Error"
          onBack={() => router.push(`/${locale}/dashboard`)}
          lang={locale}
          setLang={(nextLocale) => router.push(`/${nextLocale}/dashboard`)}
        />
        <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ padding: '16px', background: DS.colors.errorLight, border: `1px solid ${DS.colors.error}`, borderRadius: DS.radii.md, maxWidth: 400, textAlign: 'center' }}>
            <div style={{ color: DS.colors.error, fontSize: 14, fontWeight: 600 }}>{error || 'Circle not found'}</div>
          </div>
          <button onClick={() => router.push(`/${locale}/dashboard`)} style={{ padding: '10px 20px', background: DS.colors.navy, color: '#fff', border: 'none', borderRadius: DS.radii.md, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {isRtl ? 'العودة' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const isCreator = rawCircle?.is_current_user_creator ?? false;
  const youMember = jam.members.find((m) => m.isYou);
  const paidCount = jam.members.filter((m) => m.paid).length;
  const allPayments: PaymentRecord[] = rawCircle?.payments ?? [];
  const currentMonthPayments = allPayments.filter((p) => p.month_number === jam.currentMonth);
  const paymentByUser = new Map(currentMonthPayments.map((p) => [p.user_id, p]));

  const sendMessage = async () => {
    if (!chatInput.trim() || !jam) return;

    const userMessageText = chatInput;
    const userMessage: ChatMessage = {
      id: messages.length + 1,
      senderAr: isRtl ? 'أنت' : 'You',
      senderEn: 'You',
      textAr: userMessageText,
      textEn: userMessageText,
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isAI: false,
      isYou: true,
    };

    setMessages((current) => [...current, userMessage]);
    setChatInput('');
    setTyping(true);

    try {
      const apiMessages = messages.map((m) => ({
        role: m.isAI ? 'assistant' : 'user',
        content: isRtl ? m.textAr : m.textEn,
      }));
      apiMessages.push({ role: 'user', content: userMessageText });

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jam3iyyaId: circleId, messages: apiMessages }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setMessages((current) => [
          ...current,
          {
            id: current.length + 1,
            senderAr: '✦ مساعد ذكي',
            senderEn: '✦ AI Assistant',
            textAr: `خطأ: ${errorData.error || res.statusText}`,
            textEn: `Error: ${errorData.error || res.statusText}`,
            time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isAI: true,
            isYou: false,
          },
        ]);
        setTyping(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          aiResponse += text;
          setMessages((current) => {
            const last = current[current.length - 1];
            if (last?.isAI && last?.textEn === aiResponse.slice(0, -text.length)) {
              return [...current.slice(0, -1), { ...last, textAr: aiResponse, textEn: aiResponse }];
            } else if (!last?.isAI) {
              return [
                ...current,
                {
                  id: current.length + 1,
                  senderAr: '✦ مساعد ذكي',
                  senderEn: '✦ AI Assistant',
                  textAr: aiResponse,
                  textEn: aiResponse,
                  time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
                  isAI: true,
                  isYou: false,
                },
              ];
            }
            return current;
          });
        }
      }

      setTyping(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setMessages((current) => [
        ...current,
        {
          id: current.length + 1,
          senderAr: '✦ مساعد ذكي',
          senderEn: '✦ AI Assistant',
          textAr: `خطأ الشبكة: ${errorMsg}`,
          textEn: `Network Error: ${errorMsg}`,
          time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
          isAI: true,
          isYou: false,
        },
      ]);
      setTyping(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }} data-screen-label="Circle Detail">
      <TopBar
        title={isRtl ? jam.nameAr : jam.nameEn}
        onBack={() => router.push(`/${locale}/dashboard`)}
        lang={locale}
        setLang={(nextLocale) => router.push(`/${nextLocale}/jam3iyyas/${jam.id}`)}
      />

      {/* Toast notification */}
      {cycleToast && (
        <div style={{
          position: 'fixed', top: 72, left: 16, right: 16, zIndex: 100,
          background: cycleToast.startsWith('✓') ? DS.colors.successLight : DS.colors.errorLight,
          border: `1px solid ${cycleToast.startsWith('✓') ? DS.colors.success : DS.colors.error}`,
          borderRadius: DS.radii.md, padding: '12px 16px',
          color: cycleToast.startsWith('✓') ? DS.colors.success : DS.colors.error,
          fontSize: 13, fontWeight: 600, boxShadow: DS.shadow.md,
        }}>
          {cycleToast}
        </div>
      )}

      {/* Stats strip */}
      <div style={{ background: DS.colors.card, padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, borderBottom: `1px solid ${DS.colors.border}` }}>
        {[
          { label: isRtl ? 'إجمالي الصندوق' : 'Total Pot', val: `${jam.totalPot.toLocaleString()} ${t('jod')}` },
          { label: isRtl ? 'دورك' : 'Your Turn', val: `#${youMember?.turn || '–'}` },
          { label: isRtl ? 'دفعوا' : 'Paid', val: `${paidCount}/${jam.totalMembers}` },
          { label: isRtl ? 'صندوق التأمين' : 'Insurance', val: `${(jam.insuranceFund || 0).toFixed(0)} ${t('jod')}` },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center', padding: '6px 4px' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: DS.colors.navy, lineHeight: 1 }}>{stat.val}</div>
            <div style={{ fontSize: 10, color: DS.colors.muted, marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Creator: Run Cycle button */}
      {isCreator && jam.status === 'active' && (
        <div style={{ background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 11, color: DS.colors.muted }}>
            {isRtl ? `[عرض تجريبي] الشهر الحالي: ${jam.currentMonth}` : `[Demo] Current month: ${jam.currentMonth}`}
          </div>
          <button
            onClick={handleRunCycle}
            disabled={cycleRunning}
            style={{
              padding: '8px 16px', borderRadius: DS.radii.md,
              background: cycleRunning ? DS.colors.mutedLight : DS.colors.navy,
              color: cycleRunning ? DS.colors.muted : '#fff',
              border: 'none', cursor: cycleRunning ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            {cycleRunning
              ? (isRtl ? 'جارٍ المعالجة...' : 'Processing...')
              : (isRtl ? '▶ تشغيل الدورة' : '▶ Run Cycle')}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}`, display: 'flex' }}>
        {[
          { id: 'wheel' as const, ar: 'دائرة الجمعية', en: 'Circle' },
          { id: 'timeline' as const, ar: 'الجدول', en: 'Timeline' },
          { id: 'chat' as const, ar: 'المحادثة', en: 'Chat' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none',
              borderBottom: `2.5px solid ${tab === item.id ? DS.colors.navy : 'transparent'}`,
              color: tab === item.id ? DS.colors.navy : DS.colors.muted,
              fontFamily: 'inherit', fontSize: 13,
              fontWeight: tab === item.id ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {isRtl ? item.ar : item.en}
          </button>
        ))}
      </div>

      {tab === 'wheel' && (
        <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <JamiyyaWheel jam={jam} lang={locale} size={wheelSize} />

          <div style={{ marginTop: 20, width: '100%', maxWidth: 400 }}>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
              {[
                { color: DS.colors.navy, label: isRtl ? 'أنت' : 'You' },
                { color: DS.colors.successLight, border: DS.colors.success, label: isRtl ? 'استلم' : 'Received' },
                { color: DS.colors.gold, label: isRtl ? 'الدور الحالي' : 'Current Turn' },
                { color: DS.colors.card, border: DS.colors.border, label: isRtl ? 'قادم' : 'Upcoming' },
                { color: DS.colors.card, border: DS.colors.error, label: isRtl ? 'متأخر' : 'Late' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: item.color, border: item.border ? `1.5px solid ${item.border}` : 'none', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: DS.colors.muted }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Your turn card */}
            {youMember && (
              <Card style={{ padding: 16, background: `linear-gradient(135deg, ${DS.colors.goldBg}, #fff)`, border: `1px solid ${DS.colors.gold}40` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy, marginBottom: 8 }}>
                  {isRtl ? 'معلومات دورك' : 'Your Turn Info'}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.gold }}>#{youMember.turn}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{isRtl ? 'رقم الدور' : 'Turn #'}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.navy }}>{jam.amount * jam.totalMembers}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{t('jod')} {isRtl ? 'المبلغ' : 'Payout'}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.navyMid }}>{Math.max(0, youMember.turn - jam.currentMonth)}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{isRtl ? 'أشهر متبقية' : 'Months left'}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Current month payment status */}
            {jam.status === 'active' && currentMonthPayments.length > 0 && (
              <Card style={{ marginTop: 12, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: DS.colors.navy, marginBottom: 10 }}>
                  {isRtl ? `حالة الدفع — الشهر ${jam.currentMonth}` : `Payment Status — Month ${jam.currentMonth}`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {jam.members.map((member) => {
                    const memberRaw = rawCircle?.members.find((m) => m.profiles.full_name === member.nameEn);
                    const payment = memberRaw ? paymentByUser.get(memberRaw.user_id) : undefined;
                    const status = payment?.status ?? 'pending';
                    return (
                      <div key={member.turn} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 999, background: member.isYou ? DS.colors.navy : DS.colors.mutedLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: member.isYou ? '#fff' : DS.colors.navy, flexShrink: 0 }}>
                          {member.initials}
                        </div>
                        <div style={{ flex: 1, fontSize: 12, fontWeight: member.isYou ? 700 : 400, color: DS.colors.navy }}>
                          {member.nameEn}{member.isYou ? (isRtl ? ' (أنت)' : ' (You)') : ''}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: paymentStatusBg(status as PaymentRecord['status']), color: paymentStatusColor(status as PaymentRecord['status']) }}>
                          {paymentStatusLabel(status as PaymentRecord['status'], isRtl)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480, margin: '0 auto' }}>
            {jam.members.map((member, index) => {
              const memberRaw = rawCircle?.members.find((m) => m.profiles.full_name === member.nameEn);
              const memberPaymentsAll = memberRaw
                ? allPayments.filter((p) => p.user_id === memberRaw.user_id)
                : [];
              const paidMonths = memberPaymentsAll.filter(
                (p) => p.status === 'paid' || p.status === 'covered_by_insurance',
              ).length;
              const isPast = member.turn < jam.currentMonth;
              const isCurrent = member.turn === jam.currentMonth;
              const dotColor = member.isLate
                ? DS.colors.error
                : member.received
                ? DS.colors.success
                : isCurrent
                ? DS.colors.gold
                : isPast
                ? DS.colors.success
                : DS.colors.mutedLight;

              return (
                <div key={`${member.turn}-${member.nameEn}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, border: member.isYou ? `2.5px solid ${DS.colors.navy}` : 'none', boxSizing: 'border-box' }}>
                      {member.received ? '🎉' : isPast ? '✓' : member.turn}
                    </div>
                    {index < jam.members.length - 1 && <div style={{ width: 2, height: 28, background: DS.colors.mutedLight }} />}
                  </div>
                  <div style={{ flex: 1, background: DS.colors.card, borderRadius: DS.radii.md, padding: '12px 14px', border: `1px solid ${isCurrent ? DS.colors.gold : DS.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: member.isYou ? 800 : 600, fontSize: 14, color: DS.colors.navy }}>
                        {isRtl ? member.nameAr : member.nameEn}{member.isYou ? (isRtl ? ' (أنت)' : ' (You)') : ''}
                      </div>
                      <div style={{ fontSize: 11, color: DS.colors.muted }}>
                        {isRtl ? `الشهر ${member.turn}` : `Month ${member.turn}`}
                        {paidMonths > 0 && ` · ${isRtl ? `${paidMonths} دفعة` : `${paidMonths} paid`}`}
                        {member.received && (isRtl ? ' · استلم الجمعية 🎉' : ' · Received payout 🎉')}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: member.isLate ? DS.colors.errorLight : member.received ? DS.colors.successLight : isCurrent ? DS.colors.goldBg : isPast ? DS.colors.successLight : DS.colors.mutedLight, color: member.isLate ? DS.colors.error : member.received ? DS.colors.success : isCurrent ? DS.colors.gold : isPast ? DS.colors.success : DS.colors.muted }}>
                      {member.isLate
                        ? (isRtl ? 'متأخر' : 'Late')
                        : member.received
                        ? (isRtl ? 'استلم ✓' : 'Received ✓')
                        : isCurrent
                        ? (isRtl ? 'الشهر الحالي' : 'Current')
                        : isPast
                        ? (isRtl ? 'منتهي' : 'Done')
                        : (isRtl ? 'قادم' : 'Upcoming')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((message) => (
              <div key={message.id} style={{ display: 'flex', flexDirection: 'column', alignItems: message.isYou ? (isRtl ? 'flex-start' : 'flex-end') : (isRtl ? 'flex-end' : 'flex-start') }}>
                {!message.isYou && (
                  <div style={{ fontSize: 11, color: message.isAI ? DS.colors.gold : DS.colors.muted, fontWeight: 700, marginBottom: 3, paddingInline: 4 }}>
                    {isRtl ? message.senderAr : message.senderEn}
                  </div>
                )}
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: message.isYou ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: message.isYou ? DS.colors.navy : message.isAI ? DS.colors.goldBg : DS.colors.card, color: message.isYou ? '#fff' : DS.colors.navy, fontSize: 13.5, lineHeight: 1.55, border: message.isAI ? `1px solid ${DS.colors.gold}30` : `1px solid ${DS.colors.border}`, boxShadow: DS.shadow.sm }}>
                  {isRtl ? message.textAr : message.textEn}
                </div>
                <div style={{ fontSize: 10, color: DS.colors.muted, marginTop: 2, paddingInline: 4 }}>{message.time}</div>
              </div>
            ))}

            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: DS.colors.goldBg, border: `1px solid ${DS.colors.gold}30` }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: 999, background: DS.colors.gold, animation: `bounce 0.8s ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '10px 12px', background: DS.colors.card, borderTop: `1px solid ${DS.colors.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isRtl ? 'اسأل المساعد الذكي...' : 'Ask the AI assistant...'}
              style={{ flex: 1, background: DS.colors.bg, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none' }}
            />
            <button onClick={sendMessage} style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.navy, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
      `}</style>
    </div>
  );
}
