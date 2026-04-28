'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Card, JamiyyaWheel, TierBadge, AppButton, ProgressBar, TopBar } from '@/components/prototype/ui-library';
import { CHAT_MESSAGES_DATA, MOCK_JAMS, type ChatMessage, type Jam } from '@/components/prototype/mock-data';
import { DS } from '@/components/prototype/design-system';

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

function parseJamId(id: string | string[] | undefined) {
  if (Array.isArray(id)) {
    return Number(id[0]);
  }

  return Number(id);
}

export default function Jam3iyyaDetailPage() {
  const params = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const locale = (params?.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('detail');
  const isRtl = locale === 'ar';
  const jamId = parseJamId(params?.id);

  // TODO: jam data should come from Person 2's circle API.
  // TODO: chat responses should come from Person 3's chat API.
  const jam = (Number.isFinite(jamId) ? MOCK_JAMS.find((item) => item.id === jamId) : undefined) || MOCK_JAMS[0];
  const [tab, setTab] = useState<DetailTab>('wheel');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES_DATA);
  const [typing, setTyping] = useState(false);
  const [wheelSize, setWheelSize] = useState(320);

  useEffect(() => {
    const updateSize = () => setWheelSize(Math.min(window.innerWidth - 32, 320));

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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

  const sendMessage = () => {
    if (!chatInput.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      senderAr: labels.you,
      senderEn: labels.you,
      textAr: chatInput,
      textEn: chatInput,
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isAI: false,
      isYou: true,
    };

    setMessages((current) => [...current, userMessage]);
    setChatInput('');
    setTyping(true);

    setTimeout(() => {
      const reply = isRtl
        ? `دورك في الشهر ${jam.yourTurn} — ستستلمين ${jam.amount * jam.totalMembers} ${t('jod')}.`
        : `Your turn is month ${jam.yourTurn} — you will receive ${jam.amount * jam.totalMembers} ${t('jod')}.`;

      setMessages((current) => [
        ...current,
        {
          id: current.length + 1,
          senderAr: '✦ مساعد ذكي',
          senderEn: '✦ AI Assistant',
          textAr: reply,
          textEn: reply,
          time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
          isAI: true,
          isYou: false,
        },
      ]);
      setTyping(false);
    }, 1600);
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