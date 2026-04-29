'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AppButton, Card, TierBadge, TopBar } from '@/components/prototype/ui-library';
import { DS } from '@/components/prototype/design-system';

type Locale = 'ar' | 'en';
type CreateStep = 0 | 1 | 2 | 3;

type CreateStrings = {
  createCircle: string;
  createAnotherCircle: string;
  chooseCircleType: string;
  decideWhoCanJoin: string;
  circleDetails: string;
  turnAllocationMethod: string;
  chooseHowTheMonthlyPayoutOrderIsDetermined: string;
  inviteMembers: string;
  needMembersToStart: string;
  type: string;
  details: string;
  turns: string;
  invite: string;
  private: string;
  semiPublic: string;
  public: string;
  inviteOnlyFriendsFamily: string;
  openToCommunity: string;
  listedInMarketplace: string;
  randomLottery: string;
  bidAuction: string;
  needBased: string;
  joinOrder: string;
  traditionalMethod: string;
  paySmallPremium: string;
  aiSuggestsFairestAllocation: string;
  firstToJoinGetsFirstTurn: string;
  monthlyAmount: string;
  numberOfMembers: string;
  durationMonths: string;
  circleSummary: string;
  totalPot: string;
  insuranceFund: string;
  duration: string;
  name: string;
  monthlyAmountLabel: string;
  totalPotLabel: string;
  insuranceFundLabel: string;
  durationLabel: string;
  stepType: string;
  stepDetails: string;
  stepTurns: string;
  stepInvite: string;
  jod: string;
  continue: string;
  createCircle: string;
  goToDashboard: string;
  circleCreated: string;
  circleIsReady: string;
  circleName: string;
  newCircle: string;
  memberWillReceiveSMS: string;
  addMember: string;
  smsJoinLink: string;
  percentInsurance: string;
  createCircleButton: string;
  englishShort: string;
  arabicShort: string;
};

type FormState = {
  type: 'private' | 'semi' | 'public';
  nameAr: string;
  nameEn: string;
  amount: number;
  members: number;
  duration: number;
  allocation: 'lottery' | 'auction' | 'need' | 'order';
  minScore: number;
};

const INITIAL_FORM: FormState = {
  type: 'private',
  nameAr: '',
  nameEn: '',
  amount: 200,
  members: 8,
  duration: 8,
  allocation: 'lottery',
  minScore: 400,
};

export default function CreateJam3iyyaPage({ params }: Readonly<{ params: { locale: string } }>) {
  const locale = (params.locale === 'ar' ? 'ar' : 'en') as Locale;
  const t = useTranslations('create');
  const router = useRouter();
  const isRtl = locale === 'ar';
  const [step, setStep] = useState<CreateStep>(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [done, setDone] = useState(false);

  // TODO: create circle payload should be wired to Person 2's create circle API.
  const labels: CreateStrings = {
    createCircle: t('createCircle'),
    createAnotherCircle: t('createAnotherCircle'),
    chooseCircleType: t('chooseCircleType'),
    decideWhoCanJoin: t('decideWhoCanJoin'),
    circleDetails: t('circleDetails'),
    turnAllocationMethod: t('turnAllocationMethod'),
    chooseHowTheMonthlyPayoutOrderIsDetermined: t('chooseHowTheMonthlyPayoutOrderIsDetermined'),
    inviteMembers: t('inviteMembers'),
    needMembersToStart: t('needMembersToStart'),
    type: t('type'),
    details: t('details'),
    turns: t('turns'),
    invite: t('invite'),
    private: t('private'),
    semiPublic: t('semiPublic'),
    public: t('public'),
    inviteOnlyFriendsFamily: t('inviteOnlyFriendsFamily'),
    openToCommunity: t('openToCommunity'),
    listedInMarketplace: t('listedInMarketplace'),
    randomLottery: t('randomLottery'),
    bidAuction: t('bidAuction'),
    needBased: t('needBased'),
    joinOrder: t('joinOrder'),
    traditionalMethod: t('traditionalMethod'),
    paySmallPremium: t('paySmallPremium'),
    aiSuggestsFairestAllocation: t('aiSuggestsFairestAllocation'),
    firstToJoinGetsFirstTurn: t('firstToJoinGetsFirstTurn'),
    monthlyAmount: t('monthlyAmount'),
    numberOfMembers: t('numberOfMembers'),
    durationMonths: t('durationMonths'),
    circleSummary: t('circleSummary'),
    totalPot: t('totalPot'),
    insuranceFund: t('insuranceFund'),
    duration: t('duration'),
    name: t('name'),
    monthlyAmountLabel: t('monthlyAmountLabel'),
    totalPotLabel: t('totalPotLabel'),
    insuranceFundLabel: t('insuranceFundLabel'),
    durationLabel: t('durationLabel'),
    stepType: t('stepType'),
    stepDetails: t('stepDetails'),
    stepTurns: t('stepTurns'),
    stepInvite: t('stepInvite'),
    jod: t('jod'),
    continue: t('continue'),
    createCircle: t('createCircle'),
    goToDashboard: t('goToDashboard'),
    circleCreated: t('circleCreated'),
    circleIsReady: t('circleIsReady'),
    circleName: t('circleName'),
    newCircle: t('newCircle'),
    memberWillReceiveSMS: t('memberWillReceiveSMS'),
    addMember: t('addMember'),
    smsJoinLink: t('smsJoinLink'),
    percentInsurance: t('percentInsurance'),
    createCircleButton: t('createCircleButton'),
    englishShort: t('englishShort'),
    arabicShort: t('arabicShort'),
  };

  const stepLabels = [labels.type, labels.details, labels.turns, labels.invite];
  const typeOptions = [
    { id: 'private' as const, icon: '▣', label: labels.private, description: labels.inviteOnlyFriendsFamily },
    { id: 'semi' as const, icon: '◈', label: labels.semiPublic, description: labels.openToCommunity },
    { id: 'public' as const, icon: '◉', label: labels.public, description: labels.listedInMarketplace },
  ];
  const allocationOptions = [
    { id: 'lottery' as const, icon: '◇', label: labels.randomLottery, description: labels.traditionalMethod },
    { id: 'auction' as const, icon: '◈', label: labels.bidAuction, description: labels.paySmallPremium },
    { id: 'need' as const, icon: '◉', label: labels.needBased, description: labels.aiSuggestsFairestAllocation },
    { id: 'order' as const, icon: '▣', label: labels.joinOrder, description: labels.firstToJoinGetsFirstTurn },
  ];

  const totalPot = form.amount * form.members;
  const insurance = Math.round(totalPot * 0.015);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }} data-screen-label="Create Done">
        <div style={{ width: 80, height: 80, borderRadius: 24, background: DS.colors.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: DS.colors.gold, marginBottom: 24 }}>◈</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{labels.circleCreated}</h2>
        <p style={{ color: DS.colors.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 320, marginBottom: 32 }}>{labels.circleIsReady}</p>
        <div style={{ background: DS.colors.card, borderRadius: DS.radii.lg, padding: 20, width: '100%', maxWidth: 360, marginBottom: 24 }}>
          {[
            { label: labels.circleName, val: form.nameAr || labels.newCircle },
            { label: labels.monthlyAmountLabel, val: `${form.amount} ${labels.jod}` },
            { label: labels.totalPotLabel, val: `${totalPot} ${labels.jod}` },
            { label: labels.insuranceFundLabel, val: `${insurance} ${labels.jod}` },
          ].map((row, index) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: index < 3 ? `1px solid ${DS.colors.border}` : 'none' }}>
              <span style={{ fontSize: 13, color: DS.colors.muted }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: DS.colors.navy }}>{row.val}</span>
            </div>
          ))}
        </div>
        <AppButton variant="gold" size="lg" onClick={() => router.push(`/${locale}/dashboard`)} style={{ marginBottom: 12, width: '100%', maxWidth: 360, justifyContent: 'center' }}>{labels.goToDashboard}</AppButton>
        <AppButton variant="ghost" size="md" onClick={() => { setStep(0); setDone(false); setForm(INITIAL_FORM); }} style={{ color: DS.colors.muted }}>{labels.createAnotherCircle}</AppButton>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }} data-screen-label="Create Circle">
      <TopBar title={isRtl ? 'إنشاء جمعية' : 'Create Circle'} onBack={() => (step > 0 ? setStep((current) => (current - 1) as CreateStep) : router.push(`/${locale}/dashboard`))} lang={locale} setLang={(nextLocale) => router.push(`/${nextLocale}/jam3iyyas/create`)} />

      <div style={{ padding: '16px 20px 0', background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12 }}>
          {stepLabels.map((label, index) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: index < stepLabels.length - 1 ? 1 : 'none', gap: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: 999, background: step >= index ? DS.colors.navy : DS.colors.mutedLight, color: step >= index ? '#fff' : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, transition: 'all 0.3s' }}>{step > index ? '✓' : index + 1}</div>
                <span style={{ fontSize: 10, color: step >= index ? DS.colors.navy : DS.colors.muted, fontWeight: step === index ? 700 : 400 }}>{label}</span>
              </div>
              {index < stepLabels.length - 1 && <div style={{ flex: 1, height: 2, background: step > index ? DS.colors.navy : DS.colors.mutedLight, margin: '0 4px', marginBottom: 18, transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        {step === 0 && (
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: DS.colors.navy, marginBottom: 6 }}>{labels.chooseCircleType}</h3>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 20 }}>{labels.decideWhoCanJoin}</p>
            {typeOptions.map((option) => (
              <div key={option.id} onClick={() => updateForm('type', option.id)} style={{ border: `2px solid ${form.type === option.id ? DS.colors.navy : DS.colors.border}`, borderRadius: DS.radii.lg, padding: 16, marginBottom: 12, cursor: 'pointer', background: form.type === option.id ? `${DS.colors.navy}06` : DS.colors.card, transition: 'all 0.2s', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: form.type === option.id ? DS.colors.goldBg : DS.colors.mutedLight, color: form.type === option.id ? DS.colors.gold : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, transition: 'all 0.2s' }}>{option.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: DS.colors.navy, marginBottom: 4 }}>{option.label}</div>
                  <div style={{ fontSize: 13, color: DS.colors.muted, lineHeight: 1.5 }}>{option.description}</div>
                </div>
                {form.type === option.id && <div style={{ marginInlineStart: 'auto', width: 22, height: 22, borderRadius: 999, background: DS.colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#fff', fontSize: 11 }}>✓</span></div>}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: DS.colors.navy, marginBottom: 20 }}>{labels.circleDetails}</h3>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: DS.colors.muted, marginBottom: 6 }}>{labels.name}</label>
              <input value={form.nameAr} onChange={(event) => updateForm('nameAr', event.target.value)} placeholder={isRtl ? 'مثال: صندوق العرس' : 'e.g. Wedding Fund'} style={{ width: '100%', border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, background: DS.colors.card, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {[
              { label: labels.monthlyAmount, key: 'amount' as const, min: 20, max: 2000, step: 10 },
              { label: labels.numberOfMembers, key: 'members' as const, min: 3, max: 20, step: 1 },
              { label: labels.durationMonths, key: 'duration' as const, min: 3, max: 24, step: 1 },
            ].map((slider) => (
              <div key={slider.key} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: DS.colors.muted }}>{slider.label}</label>
                  <span style={{ fontSize: 14, fontWeight: 800, color: DS.colors.navy }}>{form[slider.key]}</span>
                </div>
                <input type="range" min={slider.min} max={slider.max} step={slider.step} value={form[slider.key]} onChange={(event) => updateForm(slider.key, Number(event.target.value) as never)} style={{ width: '100%', accentColor: DS.colors.navy }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: DS.colors.muted, marginTop: 2 }}>
                  <span>{slider.min}</span>
                  <span>{slider.max}</span>
                </div>
              </div>
            ))}
            <Card style={{ padding: 16, background: DS.colors.goldBg, border: `1px solid ${DS.colors.gold}30` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: DS.colors.navy, marginBottom: 8 }}>{labels.circleSummary}</div>
              {[
                { label: labels.totalPot, val: `${totalPot.toLocaleString()} ${labels.jod}` },
                { label: `${labels.insuranceFund} (1.5%)`, val: `${insurance} ${labels.jod}` },
                { label: labels.duration, val: `${form.duration} ${isRtl ? 'شهر' : 'months'}` },
              ].map((row, index) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: index < 2 ? 6 : 0 }}>
                  <span style={{ color: DS.colors.muted }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: DS.colors.navy }}>{row.val}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: DS.colors.navy, marginBottom: 6 }}>{labels.turnAllocationMethod}</h3>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{labels.chooseHowTheMonthlyPayoutOrderIsDetermined}</p>
            {allocationOptions.map((option) => (
              <div key={option.id} onClick={() => updateForm('allocation', option.id)} style={{ border: `2px solid ${form.allocation === option.id ? DS.colors.gold : DS.colors.border}`, borderRadius: DS.radii.lg, padding: 14, marginBottom: 10, cursor: 'pointer', background: form.allocation === option.id ? DS.colors.goldBg : DS.colors.card, transition: 'all 0.2s', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: form.allocation === option.id ? DS.colors.gold : DS.colors.mutedLight, color: form.allocation === option.id ? '#fff' : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{option.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy }}>{option.label}</div>
                  <div style={{ fontSize: 12, color: DS.colors.muted, lineHeight: 1.5, marginTop: 2 }}>{option.description}</div>
                </div>
                {form.allocation === option.id && <div style={{ width: 20, height: 20, borderRadius: 999, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#fff', fontSize: 10 }}>✓</span></div>}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: DS.colors.navy, marginBottom: 6 }}>{labels.inviteMembers}</h3>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 20 }}>{isRtl ? `تحتاج إلى ${form.members} عضو لبدء جمعيتك` : labels.needMembersToStart.replace('{members}', String(form.members))}</p>
            {[
              { nameAr: 'سارة عبدالله', nameEn: 'Sara Abdullah', phone: '+962 77 111 2222', score: 650 },
              { nameAr: 'خالد مصطفى', nameEn: 'Khalid Mustafa', phone: '+962 79 333 4444', score: 720 },
              { nameAr: 'ليلى الأحمد', nameEn: 'Layla Ahmad', phone: '+962 78 555 6666', score: 480 },
            ].map((member, index) => (
              <Card key={index} style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{isRtl ? member.nameAr.substring(0, 2) : member.nameEn.substring(0, 2)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: DS.colors.navy }}>{isRtl ? member.nameAr : member.nameEn}</div>
                  <div style={{ fontSize: 12, color: DS.colors.muted }}>{member.phone}</div>
                </div>
                <TierBadge score={member.score} lang={locale} />
              </Card>
            ))}
            <button style={{ width: '100%', border: `1.5px dashed ${DS.colors.borderStrong}`, borderRadius: DS.radii.md, padding: '14px', background: 'transparent', cursor: 'pointer', color: DS.colors.muted, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>+</span>
              {labels.addMember}
            </button>
            <div style={{ background: DS.colors.successLight, borderRadius: DS.radii.md, padding: '12px 16px', marginBottom: 4, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: DS.colors.success, fontSize: 16, flexShrink: 0 }}>◈</span>
              <span style={{ fontSize: 13, color: DS.colors.success, lineHeight: 1.5 }}>{labels.smsJoinLink}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px 32px', background: DS.colors.card, borderTop: `1px solid ${DS.colors.border}` }}>
        <AppButton variant={step === 3 ? 'gold' : 'primary'} size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => (step < 3 ? setStep((current) => (current + 1) as CreateStep) : setDone(true))}>
          {step < 3 ? labels.continue : labels.createCircleButton}
        </AppButton>
      </div>
    </div>
  );
}