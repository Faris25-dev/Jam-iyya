'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Card, JamiyyaWheel, TierBadge, AppButton, ProgressBar, TopBar } from '@/components/prototype/ui-library';
import { CHAT_MESSAGES_DATA, MOCK_JAMS, type ChatMessage, type Jam, type JamMember } from '@/components/prototype/mock-data';
import { DS } from '@/components/prototype/design-system';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Locale = 'ar' | 'en';
type DetailTab = 'wheel' | 'timeline' | 'chat';

type DetailStrings = {
  totalPot: string;
  yourTurn: string;
  paidMembers: string;
  insuranceFund: string;
  circleWheel: string;
  timeline: string;
  chat: string;
  member: string;
  currentTurn: string;
  currentMonth: string;
  upcoming: string;
  late: string;
  done: string;
  you: string;
  received: string;
  yourTurnInfo: string;
  turnNumber: string;
  payout: string;
  monthsLeft: string;
  month: string;
  askAI: string;
  send: string;
  circleLabel: string;
  yourScore: string;
  eligibleToJoin: string;
  seeSchedule: string;
  noData: string;
  monthLabel: string;
  totalMembers: string;
  payments: string;
  isCurrent: string;
  isDone: string;
  isLate: string;
  isUpcoming: string;
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
    members: Array<{
      user_id: string;
      turn_number: number | null;
      has_received: boolean;
      total_paid: number;
      profiles: {
        full_name: string;
      };
    }>;
  };
}

function createInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export default function Jam3iyyaDetailPage() {
  const params = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const locale = (params?.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('detail');
  const isRtl = locale === 'ar';
  const circleId = params?.id as string;

  const [jam, setJam] = useState<Jam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('wheel');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [wheelSize, setWheelSize] = useState(320);

  // Fetch circle data from API
  useEffect(() => {
    async function fetchCircle() {
      setError(null);
      setLoading(true);
      try {
        const response = await fetch(`/api/jam3iyyas/${circleId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch circle: ${response.statusText}`);
        }

        const data: CircleApiResponse = await response.json();
        const apiCircle = data.jam3iyya;

        // Transform API response to Jam interface
        const transformedMembers: JamMember[] = apiCircle.members.map((member, index) => {
          const fullName = member.profiles?.full_name || 'Unknown';
          return {
            nameAr: fullName,
            nameEn: fullName,
            turn: member.turn_number || index + 1,
            paid: member.total_paid > 0,
            received: member.has_received,
            initials: member.profiles?.full_name ? createInitials(member.profiles.full_name) : '?',
            isYou: false, // TODO: Compare with current user from session
            isLate: false, // TODO: Determine based on payment status and current month
          };
        });

        const transformedJam: Jam = {
          id: apiCircle.id,
          nameAr: apiCircle.name,
          nameEn: apiCircle.name,
          amount: apiCircle.monthly_amount,
          totalMembers: apiCircle.total_members,
          duration: apiCircle.duration_months,
          minScore: 0,
          type: 'public',
          theme: 'default',
          currentMonth: 1,
          yourTurn: 1,
          status: apiCircle.status,
          avgScore: 400,
          organizerAr: 'منظم الجمعية',
          organizerEn: 'Circle Organizer',
          descriptionAr: apiCircle.description || '',
          descriptionEn: apiCircle.description || '',
          insuranceFund: Math.round(apiCircle.monthly_amount * apiCircle.total_members * 0.05),
          totalPot: apiCircle.monthly_amount * apiCircle.total_members,
          members: transformedMembers,
        };

        setJam(transformedJam);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setJam(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCircle();
  }, [circleId]);

  useEffect(() => {
    const updateSize = () => setWheelSize(Math.min(window.innerWidth - 32, 320));

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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

  const youMember = jam.members.find((member) => member.isYou);
  const paidCount = jam.members.filter((member) => member.paid).length;

  const labels: DetailStrings = {
    totalPot: t('totalPot'),
    yourTurn: t('yourTurn'),
    paidMembers: t('paidMembers'),
    insuranceFund: t('insuranceFund'),
    circleWheel: t('circleWheel'),
    timeline: t('timeline'),
    chat: t('chat'),
    member: t('member'),
    currentTurn: t('currentTurn'),
    currentMonth: t('currentMonth'),
    upcoming: t('upcoming'),
    late: t('late'),
    done: t('done'),
    you: t('you'),
    received: t('received'),
    yourTurnInfo: t('yourTurnInfo'),
    turnNumber: t('turnNumber'),
    payout: t('payout'),
    monthsLeft: t('monthsLeft'),
    month: t('month'),
    askAI: t('askAI'),
    send: t('send'),
    circleLabel: t('circleLabel'),
    yourScore: t('yourScore'),
    eligibleToJoin: t('eligibleToJoin'),
    seeSchedule: t('seeSchedule'),
    noData: t('noData'),
    monthLabel: t('monthLabel'),
    totalMembers: t('totalMembers'),
    payments: t('payments'),
    isCurrent: t('isCurrent'),
    isDone: t('isDone'),
    isLate: t('isLate'),
    isUpcoming: t('isUpcoming'),
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !jam) {
      return;
    }

    const userMessageText = chatInput;
    const userMessage: ChatMessage = {
      id: messages.length + 1,
      senderAr: labels.you,
      senderEn: labels.you,
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
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMessages((current) => [
          ...current,
          {
            id: current.length + 1,
            senderAr: '✦ مساعد ذكي',
            senderEn: '✦ AI Assistant',
            textAr: 'خطأ: لم تتمكن من الاتصال. يرجى تسجيل الدخول مرة أخرى.',
            textEn: 'Error: Unable to connect. Please log in again.',
            time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isAI: true,
            isYou: false,
          },
        ]);
        setTyping(false);
        return;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jam3iyyaId: circleId,
          messages: [{ role: 'user', content: userMessageText }],
        }),
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

      // Read the streaming response chunk by chunk
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          aiResponse += text;

          // Update messages with the accumulated response
          setMessages((current) => {
            const lastMessage = current[current.length - 1];
            if (lastMessage?.isAI && lastMessage?.textEn === aiResponse.slice(0, -text.length)) {
              // Update existing AI message
              return [
                ...current.slice(0, -1),
                {
                  ...lastMessage,
                  textAr: aiResponse,
                  textEn: aiResponse,
                },
              ];
            } else if (!lastMessage?.isAI) {
              // Create new AI message
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

  const aiHints = isRtl
    ? [
        'دورك في الشهر القادم! استعد لاستلام الجمعية. 🎉',
        `إجمالي ما دفعته حتى الآن: ${jam.amount * jam.currentMonth} د.أ`,
        `صندوق التأمين لجمعيتك يبلغ ${jam.insuranceFund} د.أ — مبلغ آمن جداً!`,
        `متوسط درجة ثقة أعضاء جمعيتك ${jam.avgScore} — من أعلى الجمعيات أماناً.`,
      ]
    : [
        'Your turn is next month! Get ready to receive your payout. 🎉',
        `Total paid so far: ${jam.amount * jam.currentMonth} JOD`,
        `Your circle's insurance fund is ${jam.insuranceFund} JOD — very safe!`,
        `Average trust score of your circle is ${jam.avgScore} — one of the safest circles!`,
      ];

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }} data-screen-label="Circle Detail">
      <TopBar
        title={isRtl ? jam.nameAr : jam.nameEn}
        onBack={() => router.push(`/${locale}/dashboard`)}
        lang={locale}
        setLang={(nextLocale) => router.push(`/${nextLocale}/jam3iyyas/${jam.id}`)}
      />

      <div style={{ background: DS.colors.card, padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, borderBottom: `1px solid ${DS.colors.border}` }}>
        {[
          { label: labels.totalPot, val: `${jam.totalPot.toLocaleString()} ${t('jod')}` },
          { label: isRtl ? labels.yourTurn : labels.yourTurn, val: `#${youMember?.turn || '–'}` },
          { label: labels.paidMembers, val: `${paidCount}/${jam.totalMembers}` },
          { label: labels.insuranceFund, val: `${jam.insuranceFund} ${t('jod')}` },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center', padding: '6px 4px' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: DS.colors.navy, lineHeight: 1 }}>{stat.val}</div>
            <div style={{ fontSize: 10, color: DS.colors.muted, marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

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
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: `2.5px solid ${tab === item.id ? DS.colors.navy : 'transparent'}`,
              color: tab === item.id ? DS.colors.navy : DS.colors.muted,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: tab === item.id ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
              {[
                { color: DS.colors.navy, label: labels.you },
                { color: DS.colors.successLight, border: DS.colors.success, label: labels.received },
                { color: DS.colors.gold, label: labels.currentTurn },
                { color: DS.colors.card, border: DS.colors.border, label: labels.upcoming },
                { color: DS.colors.card, border: DS.colors.error, label: labels.late },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: item.color, border: item.border ? `1.5px solid ${item.border}` : 'none', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: DS.colors.muted }}>{item.label}</span>
                </div>
              ))}
            </div>

            {youMember && (
              <Card style={{ padding: 16, background: `linear-gradient(135deg, ${DS.colors.goldBg}, #fff)`, border: `1px solid ${DS.colors.gold}40` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy, marginBottom: 8 }}>{labels.yourTurnInfo}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.gold }}>#{youMember.turn}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{labels.turnNumber}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.navy }}>{jam.amount * jam.totalMembers}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{t('jod')} {labels.payout}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.navyMid }}>{Math.max(0, youMember.turn - jam.currentMonth)}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{labels.monthsLeft}</div>
                  </div>
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
              const isPast = member.turn <= jam.currentMonth;
              const isCurrent = member.turn === jam.currentMonth + 1;
              const dotColor = member.isLate ? DS.colors.error : isPast ? DS.colors.success : isCurrent ? DS.colors.gold : DS.colors.mutedLight;

              return (
                <div key={`${member.turn}-${member.nameEn}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, border: member.isYou ? `2.5px solid ${DS.colors.navy}` : 'none', boxSizing: 'border-box' }}>
                      {isPast ? '✓' : member.turn}
                    </div>
                    {index < jam.members.length - 1 && <div style={{ width: 2, height: 28, background: DS.colors.mutedLight, marginTop: 0 }} />}
                  </div>
                  <div style={{ flex: 1, background: DS.colors.card, borderRadius: DS.radii.md, padding: '12px 14px', border: `1px solid ${isCurrent ? DS.colors.gold : DS.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: member.isYou ? 800 : 600, fontSize: 14, color: DS.colors.navy }}>
                        {isRtl ? member.nameAr : member.nameEn} {member.isYou && `(${labels.you})`}
                      </div>
                      <div style={{ fontSize: 11, color: DS.colors.muted }}>
                        {isRtl ? `${labels.monthLabel} ${member.turn}` : `${labels.monthLabel} ${member.turn}`}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: member.isLate ? DS.colors.errorLight : isPast ? DS.colors.successLight : isCurrent ? DS.colors.goldBg : DS.colors.mutedLight, color: member.isLate ? DS.colors.error : isPast ? DS.colors.success : isCurrent ? DS.colors.gold : DS.colors.muted }}>
                      {member.isLate ? labels.isLate : isPast ? labels.isDone : isCurrent ? labels.currentMonth : labels.isUpcoming}
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
                    {[0, 1, 2].map((index) => (
                      <div key={index} style={{ width: 6, height: 6, borderRadius: 999, background: DS.colors.gold, animation: `bounce 0.8s ${index * 0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '10px 12px', background: DS.colors.card, borderTop: `1px solid ${DS.colors.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
              placeholder={labels.askAI}
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

      <style>{`@keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }`}</style>
    </div>
  );
}