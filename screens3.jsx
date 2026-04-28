// screens3.jsx — Create + Detail + Payment

// ===== CREATE SCREEN =====
function CreateScreen({ nav }) {
  const { screen, setScreen, lang, setLang } = nav;
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    type: 'private', nameAr: '', nameEn: '', amount: 200,
    members: 8, duration: 8, allocation: 'lottery', minScore: 400,
  });
  const [done, setDone] = React.useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const stepLabels = isRtl
    ? ['النوع', 'التفاصيل', 'الأدوار', 'الدعوة']
    : ['Type', 'Details', 'Turns', 'Invite'];

  const typeOpts = [
    { id: 'private', icon: '▣', ar: 'خاص', en: 'Private', descAr: 'ادعُ أصدقاءك وعائلتك فقط', descEn: 'Invite only your friends & family' },
    { id: 'semi', icon: '◈', ar: 'شبه عام', en: 'Semi-Public', descAr: 'مفتوح لمجموعة محددة (زملاء، مجتمع)', descEn: 'Open to a specific community' },
    { id: 'public', icon: '◉', ar: 'عام', en: 'Public', descAr: 'مدرج في السوق لأي عضو مؤهل', descEn: 'Listed in marketplace for any qualified member' },
  ];

  const allocOpts = [
    { id: 'lottery', icon: '◇', ar: 'قرعة عشوائية', en: 'Random Lottery', descAr: 'الطريقة التقليدية — كل عضو يأخذ دوره بالقرعة', descEn: 'Traditional method — turns drawn by random lottery' },
    { id: 'auction', icon: '◈', ar: 'مزاد العطاءات', en: 'Bid Auction', descAr: 'من يريد دورًا مبكرًا يدفع علاوة صغيرة', descEn: 'Pay a small premium to get an earlier turn' },
    { id: 'need', icon: '◉', ar: 'حسب الحاجة', en: 'Need-Based', descAr: 'الذكاء الاصطناعي يقترح التوزيع الأمثل', descEn: 'AI suggests the fairest allocation based on need' },
    { id: 'order', icon: '▣', ar: 'ترتيب الانضمام', en: 'Join Order', descAr: 'الأول في الانضمام يأخذ الدور الأول', descEn: 'First to join gets the first turn' },
  ];

  const totalPot = form.amount * form.members;
  const insurance = Math.round(totalPot * 0.015);

  if (done) return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }} data-screen-label="Create Done">
      <div style={{ width: 80, height: 80, borderRadius: 24, background: DS.colors.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: DS.colors.gold, marginBottom: 24 }}>◈</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>
        {isRtl ? 'تم إنشاء جمعيتك!' : 'Circle Created!'}
      </h2>
      <p style={{ color: DS.colors.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 320, marginBottom: 32 }}>
        {isRtl ? 'جمعيتك جاهزة. سيتلقى الأعضاء المدعوون رابط الانضمام عبر رسالة نصية.' : 'Your circle is ready. Invited members will receive a join link via SMS.'}
      </p>
      <div style={{ background: DS.colors.card, borderRadius: DS.radii.lg, padding: 20, width: '100%', maxWidth: 360, marginBottom: 24 }}>
        {[
          { label: isRtl ? 'اسم الجمعية' : 'Circle Name', val: form.nameAr || (isRtl ? 'جمعية جديدة' : 'New Circle') },
          { label: isRtl ? 'المبلغ الشهري' : 'Monthly Amount', val: `${form.amount} ${t.jod}` },
          { label: isRtl ? 'إجمالي الصندوق' : 'Total Pot', val: `${totalPot} ${t.jod}` },
          { label: isRtl ? 'صندوق التأمين' : 'Insurance Fund', val: `${insurance} ${t.jod}` },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${DS.colors.border}` : 'none' }}>
            <span style={{ fontSize: 13, color: DS.colors.muted }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: DS.colors.navy }}>{row.val}</span>
          </div>
        ))}
      </div>
      <AppButton variant="gold" size="lg" onClick={() => { setScreen('dashboard'); }} style={{ marginBottom: 12, width: '100%', maxWidth: 360, justifyContent: 'center' }}>
        {t.goToDashboard}
      </AppButton>
      <AppButton variant="ghost" size="md" onClick={() => { setStep(0); setDone(false); }} style={{ color: DS.colors.muted }}>
        {isRtl ? 'إنشاء جمعية أخرى' : 'Create another circle'}
      </AppButton>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }} data-screen-label="Create Circle">
      <TopBar title={isRtl ? 'إنشاء جمعية' : 'Create Circle'} onBack={() => step > 0 ? setStep(s => s-1) : setScreen('dashboard')} lang={lang} setLang={setLang} />

      {/* Progress */}
      <div style={{ padding: '16px 20px 0', background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12 }}>
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: 999, background: step >= i ? DS.colors.navy : DS.colors.mutedLight, color: step >= i ? '#fff' : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, transition: 'all 0.3s' }}>
                  {step > i ? '✓' : i+1}
                </div>
                <span style={{ fontSize: 10, color: step >= i ? DS.colors.navy : DS.colors.muted, fontWeight: step === i ? 700 : 400 }}>{label}</span>
              </div>
              {i < stepLabels.length-1 && <div style={{ flex: 1, height: 2, background: step > i ? DS.colors.navy : DS.colors.mutedLight, margin: '0 4px', marginBottom: 18, transition: 'background 0.3s' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 480, margin: '0 auto', width: '100%' }}>

        {/* Step 0: Type */}
        {step === 0 && (
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: DS.colors.navy, marginBottom: 6 }}>{isRtl ? 'اختر نوع الجمعية' : 'Choose Circle Type'}</h3>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 20 }}>{isRtl ? 'حدد من يمكنه الانضمام إلى جمعيتك' : 'Decide who can join your circle'}</p>
            {typeOpts.map(opt => (
              <div key={opt.id} onClick={() => setF('type', opt.id)}
                style={{ border: `2px solid ${form.type === opt.id ? DS.colors.navy : DS.colors.border}`, borderRadius: DS.radii.lg, padding: 16, marginBottom: 12, cursor: 'pointer', background: form.type === opt.id ? `${DS.colors.navy}06` : DS.colors.card, transition: 'all 0.2s', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: form.type === opt.id ? DS.colors.goldBg : DS.colors.mutedLight, color: form.type === opt.id ? DS.colors.gold : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, transition: 'all 0.2s' }}>{opt.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: DS.colors.navy, marginBottom: 4 }}>{isRtl ? opt.ar : opt.en}</div>
                  <div style={{ fontSize: 13, color: DS.colors.muted, lineHeight: 1.5 }}>{isRtl ? opt.descAr : opt.descEn}</div>
                </div>
                {form.type === opt.id && <div style={{ marginInlineStart: 'auto', width: 22, height: 22, borderRadius: 999, background: DS.colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#fff', fontSize: 11 }}>✓</span></div>}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: DS.colors.navy, marginBottom: 20 }}>{isRtl ? 'تفاصيل الجمعية' : 'Circle Details'}</h3>
            {[
              { label: isRtl ? 'اسم الجمعية' : 'Circle Name', key: 'nameAr', type: 'text', placeholder: isRtl ? 'مثال: صندوق العرس' : 'e.g. Wedding Fund' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: DS.colors.muted, marginBottom: 6 }}>{field.label}</label>
                <input value={form[field.key]} onChange={e => setF(field.key, e.target.value)} placeholder={field.placeholder}
                  style={{ width: '100%', border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, background: DS.colors.card, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            {[
              { label: isRtl ? `المبلغ الشهري (د.أ)` : 'Monthly Amount (JOD)', key: 'amount', min: 20, max: 2000, step: 10 },
              { label: isRtl ? 'عدد الأعضاء' : 'Number of Members', key: 'members', min: 3, max: 20, step: 1 },
              { label: isRtl ? 'المدة (أشهر)' : 'Duration (months)', key: 'duration', min: 3, max: 24, step: 1 },
            ].map(sl => (
              <div key={sl.key} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: DS.colors.muted }}>{sl.label}</label>
                  <span style={{ fontSize: 14, fontWeight: 800, color: DS.colors.navy }}>{form[sl.key]}</span>
                </div>
                <input type="range" min={sl.min} max={sl.max} step={sl.step} value={form[sl.key]} onChange={e => setF(sl.key, Number(e.target.value))}
                  style={{ width: '100%', accentColor: DS.colors.navy }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: DS.colors.muted, marginTop: 2 }}>
                  <span>{sl.min}</span><span>{sl.max}</span>
                </div>
              </div>
            ))}
            <Card style={{ padding: 16, background: DS.colors.goldBg, border: `1px solid ${DS.colors.gold}30` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: DS.colors.navy, marginBottom: 8 }}>{isRtl ? 'ملخص الجمعية' : 'Circle Summary'}</div>
              {[
                { label: isRtl ? 'إجمالي الصندوق' : 'Total Pot', val: `${totalPot.toLocaleString()} ${t.jod}` },
                { label: isRtl ? 'صندوق التأمين (١.٥٪)' : 'Insurance Fund (1.5%)', val: `${insurance} ${t.jod}` },
                { label: isRtl ? 'مدة الجمعية' : 'Duration', val: `${form.duration} ${isRtl ? 'شهر' : 'months'}` },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: i < 2 ? 6 : 0 }}>
                  <span style={{ color: DS.colors.muted }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: DS.colors.navy }}>{r.val}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Step 2: Allocation */}
        {step === 2 && (
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: DS.colors.navy, marginBottom: 6 }}>{isRtl ? 'طريقة توزيع الأدوار' : 'Turn Allocation Method'}</h3>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{isRtl ? 'اختر كيف يُحدَّد ترتيب من يستلم الجمعية كل شهر' : 'Choose how the monthly payout order is determined'}</p>
            {allocOpts.map(opt => (
              <div key={opt.id} onClick={() => setF('allocation', opt.id)}
                style={{ border: `2px solid ${form.allocation === opt.id ? DS.colors.gold : DS.colors.border}`, borderRadius: DS.radii.lg, padding: 14, marginBottom: 10, cursor: 'pointer', background: form.allocation === opt.id ? DS.colors.goldBg : DS.colors.card, transition: 'all 0.2s', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: form.allocation === opt.id ? DS.colors.gold : DS.colors.mutedLight, color: form.allocation === opt.id ? '#fff' : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy }}>{isRtl ? opt.ar : opt.en}</div>
                  <div style={{ fontSize: 12, color: DS.colors.muted, lineHeight: 1.5, marginTop: 2 }}>{isRtl ? opt.descAr : opt.descEn}</div>
                </div>
                {form.allocation === opt.id && <div style={{ width: 20, height: 20, borderRadius: 999, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#fff', fontSize: 10 }}>✓</span></div>}
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Invite */}
        {step === 3 && (
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: DS.colors.navy, marginBottom: 6 }}>{isRtl ? 'دعوة الأعضاء' : 'Invite Members'}</h3>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 20 }}>{isRtl ? `تحتاج إلى ${form.members} عضو لبدء جمعيتك` : `You need ${form.members} members to start your circle`}</p>
            {[
              { nameAr: 'سارة عبدالله', nameEn: 'Sara Abdullah', phone: '+962 77 111 2222', score: 650 },
              { nameAr: 'خالد مصطفى', nameEn: 'Khalid Mustafa', phone: '+962 79 333 4444', score: 720 },
              { nameAr: 'ليلى الأحمد', nameEn: 'Layla Ahmad', phone: '+962 78 555 6666', score: 480 },
            ].map((member, i) => (
              <Card key={i} style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {isRtl ? member.nameAr.substring(0, 2) : member.nameEn.substring(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: DS.colors.navy }}>{isRtl ? member.nameAr : member.nameEn}</div>
                  <div style={{ fontSize: 12, color: DS.colors.muted }}>{member.phone}</div>
                </div>
                <TierBadge score={member.score} lang={lang} />
              </Card>
            ))}
            <button style={{ width: '100%', border: `1.5px dashed ${DS.colors.borderStrong}`, borderRadius: DS.radii.md, padding: '14px', background: 'transparent', cursor: 'pointer', color: DS.colors.muted, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>+</span>
              {isRtl ? 'إضافة عضو' : 'Add Member'}
            </button>
            <div style={{ background: DS.colors.successLight, borderRadius: DS.radii.md, padding: '12px 16px', marginBottom: 4, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: DS.colors.success, fontSize: 16, flexShrink: 0 }}>◈</span>
              <span style={{ fontSize: 13, color: DS.colors.success, lineHeight: 1.5 }}>
                {isRtl ? 'سيتلقى كل عضو رسالة SMS برابط الانضمام. سيبدأ الحساب بعد اكتمال العدد.' : 'Each member will receive an SMS with a join link. Counting begins once all seats are filled.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: '16px 20px 32px', background: DS.colors.card, borderTop: `1px solid ${DS.colors.border}` }}>
        <AppButton variant={step === 3 ? 'gold' : 'primary'} size="lg" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => step < 3 ? setStep(s => s+1) : setDone(true)}>
          {step < 3 ? t.continue : (isRtl ? 'إنشاء الجمعية' : 'Create Circle')}
        </AppButton>
      </div>
    </div>
  );
}

// ===== DETAIL SCREEN =====
function DetailScreen({ nav }) {
  const { screen, setScreen, lang, setLang, selectedJam } = nav;
  const jam = selectedJam || MOCK_JAMS[0];
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  const [tab, setTab] = React.useState('wheel'); // wheel | timeline | chat
  const [chatInput, setChatInput] = React.useState('');
  const [messages, setMessages] = React.useState(CHAT_MESSAGES_DATA);
  const [typing, setTyping] = React.useState(false);

  const youMember = jam.members.find(m => m.isYou);
  const paidCount = jam.members.filter(m => m.paid).length;
  const tier = DS.getTier(jam.minScore || 0);

  const aiReplies = isRtl ? [
    'دورك في الشهر القادم! استعد لاستلام الجمعية. 🎉',
    `إجمالي ما دفعته حتى الآن: ${jam.amount * jam.currentMonth} د.أ`,
    `صندوق التأمين لجمعيتك يبلغ ${jam.insuranceFund} د.أ — مبلغ آمن جداً!`,
    `متوسط درجة ثقة أعضاء جمعيتك ${jam.avgScore} — من أعلى الجمعيات أماناً.`,
  ] : [
    'Your turn is next month! Get ready to receive your payout. 🎉',
    `Total paid so far: ${jam.amount * jam.currentMonth} JOD`,
    `Your circle's insurance fund is ${jam.insuranceFund} JOD — very safe!`,
    `Average trust score of your circle is ${jam.avgScore} — one of the safest circles!`,
  ];
  let aiIdx = 0;

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { id: messages.length + 1, senderAr: 'أنت', senderEn: 'You', textAr: chatInput, textEn: chatInput, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }), isAI: false, isYou: true };
    setMessages(m => [...m, userMsg]);
    setChatInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
      setMessages(m => [...m, { id: m.length + 1, senderAr: '✦ مساعد ذكي', senderEn: '✦ AI Assistant', textAr: reply, textEn: reply, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }), isAI: true, isYou: false }]);
      setTyping(false);
    }, 1600);
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }} data-screen-label="Circle Detail">
      <TopBar title={isRtl ? jam.nameAr : jam.nameEn} onBack={() => setScreen('dashboard')} lang={lang} setLang={setLang} />

      {/* Stats row */}
      <div style={{ background: DS.colors.card, padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, borderBottom: `1px solid ${DS.colors.border}` }}>
        {[
          { label: t.totalPot, val: `${jam.totalPot.toLocaleString()} ${t.jod}` },
          { label: isRtl ? 'دورك' : 'Your Turn', val: `#${youMember?.turn || '–'}` },
          { label: t.paidMembers, val: `${paidCount}/${jam.totalMembers}` },
          { label: t.insuranceFund, val: `${jam.insuranceFund} ${t.jod}` },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '6px 4px' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: DS.colors.navy, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: DS.colors.muted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}`, display: 'flex' }}>
        {[
          { id: 'wheel', ar: 'دائرة الجمعية', en: 'Circle' },
          { id: 'timeline', ar: 'الجدول', en: 'Timeline' },
          { id: 'chat', ar: 'المحادثة', en: 'Chat' },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: `2.5px solid ${tab === tb.id ? DS.colors.navy : 'transparent'}`, color: tab === tb.id ? DS.colors.navy : DS.colors.muted, fontFamily: 'inherit', fontSize: 13, fontWeight: tab === tb.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
            {isRtl ? tb.ar : tb.en}
          </button>
        ))}
      </div>

      {/* Wheel tab */}
      {tab === 'wheel' && (
        <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <JamiyyaWheel jam={jam} lang={lang} size={Math.min(window.innerWidth - 32, 320)} />
          <div style={{ marginTop: 20, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
              {[
                { color: DS.colors.navy, label: isRtl ? 'أنت' : 'You' },
                { color: DS.colors.successLight, border: DS.colors.success, label: isRtl ? 'استلم' : 'Received' },
                { color: DS.colors.gold, label: isRtl ? 'الدور الحالي' : 'Current Turn' },
                { color: DS.colors.card, border: DS.colors.border, label: isRtl ? 'قادم' : 'Upcoming' },
                { color: DS.colors.card, border: DS.colors.error, label: isRtl ? 'متأخر' : 'Late' },
              ].map((leg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: leg.color, border: leg.border ? `1.5px solid ${leg.border}` : 'none', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: DS.colors.muted }}>{leg.label}</span>
                </div>
              ))}
            </div>
            {youMember && (
              <Card style={{ padding: 16, background: `linear-gradient(135deg, ${DS.colors.goldBg}, #fff)`, border: `1px solid ${DS.colors.gold}40` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy, marginBottom: 8 }}>
                  {isRtl ? 'معلومات دورك' : 'Your Turn Info'}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.gold }}>#{youMember.turn}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{isRtl ? 'رقم دورك' : 'Turn #'}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.navy }}>{jam.amount * jam.totalMembers}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{t.jod} {isRtl ? 'ستستلم' : 'payout'}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: DS.colors.navyMid }}>{youMember.turn - jam.currentMonth}</div>
                    <div style={{ fontSize: 11, color: DS.colors.muted }}>{isRtl ? 'أشهر متبقية' : 'months left'}</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Timeline tab */}
      {tab === 'timeline' && (
        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480, margin: '0 auto' }}>
            {jam.members.map((m, i) => {
              const isPast = m.turn <= jam.currentMonth;
              const isCurrent = m.turn === jam.currentMonth + 1;
              const dotColor = m.isLate ? DS.colors.error : isPast ? DS.colors.success : isCurrent ? DS.colors.gold : DS.colors.mutedLight;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, border: m.isYou ? `2.5px solid ${DS.colors.navy}` : 'none', boxSizing: 'border-box' }}>
                      {isPast ? '✓' : m.turn}
                    </div>
                    {i < jam.members.length - 1 && <div style={{ width: 2, height: 28, background: DS.colors.mutedLight, marginTop: 0 }} />}
                  </div>
                  <div style={{ flex: 1, background: DS.colors.card, borderRadius: DS.radii.md, padding: '12px 14px', border: `1px solid ${isCurrent ? DS.colors.gold : DS.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: m.isYou ? 800 : 600, fontSize: 14, color: DS.colors.navy }}>
                        {isRtl ? m.nameAr : m.nameEn} {m.isYou && `(${isRtl ? 'أنت' : 'You'})`}
                      </div>
                      <div style={{ fontSize: 11, color: DS.colors.muted }}>
                        {isRtl ? `الشهر ${m.turn}` : `Month ${m.turn}`}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: m.isLate ? DS.colors.errorLight : isPast ? DS.colors.successLight : isCurrent ? DS.colors.goldBg : DS.colors.mutedLight, color: m.isLate ? DS.colors.error : isPast ? DS.colors.success : isCurrent ? DS.colors.gold : DS.colors.muted }}>
                      {m.isLate ? (isRtl ? 'متأخر' : 'Late') : isPast ? (isRtl ? 'اكتمل' : 'Done') : isCurrent ? (isRtl ? 'الشهر الحالي' : 'Current') : (isRtl ? 'قادم' : 'Upcoming')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat tab */}
      {tab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isYou ? (isRtl ? 'flex-start' : 'flex-end') : (isRtl ? 'flex-end' : 'flex-start') }}>
                {!msg.isYou && (
                  <div style={{ fontSize: 11, color: msg.isAI ? DS.colors.gold : DS.colors.muted, fontWeight: 700, marginBottom: 3, paddingInline: 4 }}>
                    {isRtl ? msg.senderAr : msg.senderEn}
                  </div>
                )}
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.isYou ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.isYou ? DS.colors.navy : msg.isAI ? DS.colors.goldBg : DS.colors.card, color: msg.isYou ? '#fff' : DS.colors.navy, fontSize: 13.5, lineHeight: 1.55, border: msg.isAI ? `1px solid ${DS.colors.gold}30` : `1px solid ${DS.colors.border}`, boxShadow: DS.shadow.sm }}>
                  {isRtl ? msg.textAr : msg.textEn}
                </div>
                <div style={{ fontSize: 10, color: DS.colors.muted, marginTop: 2, paddingInline: 4 }}>{msg.time}</div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: DS.colors.goldBg, border: `1px solid ${DS.colors.gold}30` }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: 999, background: DS.colors.gold, animation: `bounce 0.8s ${i*0.15}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: '10px 12px', background: DS.colors.card, borderTop: `1px solid ${DS.colors.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={t.askAI}
              style={{ flex: 1, background: DS.colors.bg, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none' }} />
            <button onClick={sendMessage}
              style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.navy, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }`}</style>
    </div>
  );
}

// ===== PAYMENT SCREEN =====
function PaymentScreen({ nav }) {
  const { screen, setScreen, lang, setLang } = nav;
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showInsurance, setShowInsurance] = React.useState(false);
  const [moneyAnim, setMoneyAnim] = React.useState(false);
  const jam = MOCK_JAMS[1]; // Business Capital — yourTurn = 3, currentMonth = 2, so payout!

  React.useEffect(() => {
    setTimeout(() => setMoneyAnim(true), 300);
    setTimeout(() => setShowConfetti(true), 1200);
  }, []);

  const confettiColors = [DS.colors.gold, '#fff', DS.colors.navy, '#e8f4ee', DS.colors.goldLight];
  const confettiPieces = Array.from({ length: 36 }, (_, i) => ({
    id: i, color: confettiColors[i % confettiColors.length],
    x: 10 + Math.random() * 80, delay: Math.random() * 1.5,
    size: 6 + Math.random() * 8, rotate: Math.random() * 360,
    dur: 2.5 + Math.random() * 1.5,
  }));

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.navy, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} data-screen-label="Payout Day">
      <GeoBg opacity={0.05} />

      {/* Confetti */}
      {showConfetti && confettiPieces.map(p => (
        <div key={p.id} style={{ position: 'fixed', top: '-20px', left: `${p.x}%`, width: p.size, height: p.size * 0.5, background: p.color, borderRadius: 2, zIndex: 10, transform: `rotate(${p.rotate}deg)`, animation: `fall ${p.dur}s ${p.delay}s ease-in both` }} />
      ))}

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 5 }}>
        <button onClick={() => setScreen('dashboard')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}/></svg>
        </button>
        <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
          {lang==='ar'?'EN':'ع'}
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 24px', position: 'relative', zIndex: 5, textAlign: 'center' }}>

        {/* Payout badge */}
        <div style={{ background: DS.colors.gold, borderRadius: 999, padding: '6px 18px', marginBottom: 24, display: 'inline-block' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.04em' }}>
            {isRtl ? '✦ يوم الصرف' : '✦ PAYOUT DAY'}
          </span>
        </div>

        <h1 style={{ color: '#fff', fontSize: isRtl ? 26 : 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>
          {t.payoutMsg}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 40 }}>
          {isRtl ? 'رأس المال التجاري · الدور #٣' : 'Business Capital · Turn #3'}
        </p>

        {/* Amount display */}
        <div style={{ position: 'relative', marginBottom: 48 }}>
          <div style={{ width: 200, height: 200, borderRadius: 999, background: 'rgba(196,150,62,0.15)', border: `2px solid ${DS.colors.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)', transform: moneyAnim ? 'scale(1)' : 'scale(0.5)', opacity: moneyAnim ? 1 : 0 }}>
            <div style={{ width: 160, height: 160, borderRadius: 999, background: 'rgba(196,150,62,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: DS.colors.gold, letterSpacing: '-0.02em', lineHeight: 1 }}>5,000</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600, marginTop: 4 }}>{t.jod}</div>
              </div>
            </div>
          </div>
          {/* Money particles */}
          {moneyAnim && [0,1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, borderRadius: 999, background: DS.colors.gold, transform: `translate(-50%,-50%) translate(${Math.cos(i/8*Math.PI*2)*110}px,${Math.sin(i/8*Math.PI*2)*110}px)`, opacity: 0.6, animation: `orbit 3s ${i*0.2}s linear infinite` }} />
          ))}
        </div>

        {/* Breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: DS.radii.lg, padding: 20, width: '100%', maxWidth: 380, marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { label: isRtl ? 'مساهمات الأعضاء' : 'Member Contributions', val: `${jam.amount * jam.totalMembers} ${t.jod}`, color: '#fff' },
            { label: isRtl ? 'عدد الأعضاء' : 'Members', val: jam.totalMembers, color: 'rgba(255,255,255,0.6)' },
            { label: isRtl ? 'الجمعية' : 'Circle', val: isRtl ? jam.nameAr : jam.nameEn, color: 'rgba(255,255,255,0.6)' },
            { label: isRtl ? 'المبلغ الذي ستستلمه' : 'You will receive', val: `5,000 ${t.jod}`, color: DS.colors.gold, bold: true },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: 8, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: row.bold ? 800 : 600, color: row.color }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Insurance fund demo */}
        <div style={{ width: '100%', maxWidth: 380, marginBottom: 24 }}>
          <button onClick={() => setShowInsurance(!showInsurance)}
            style={{ width: '100%', background: showInsurance ? 'rgba(196,150,62,0.2)' : 'rgba(255,255,255,0.07)', border: `1px solid ${showInsurance ? DS.colors.gold : 'rgba(255,255,255,0.12)'}`, borderRadius: DS.radii.md, padding: '13px 16px', cursor: 'pointer', fontFamily: 'inherit', color: showInsurance ? DS.colors.gold : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
            <span>◈ {isRtl ? 'شاهد صندوق التأمين في العمل' : 'See Insurance Fund in Action'}</span>
            <span style={{ fontSize: 18 }}>{showInsurance ? '▲' : '▼'}</span>
          </button>

          {showInsurance && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${DS.colors.gold}30`, borderTop: 'none', borderRadius: `0 0 ${DS.radii.md}px ${DS.radii.md}px`, padding: 16, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${DS.colors.error}30`, border: `1px solid ${DS.colors.error}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: DS.colors.error, fontSize: 16 }}>!</span>
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.insuranceKickedIn}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6 }}>{t.defaultMsg}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: isRtl ? 'المبلغ الناقص' : 'Missing Amount', val: `500 ${t.jod}`, color: DS.colors.error },
                  { label: isRtl ? 'غطّى الصندوق' : 'Fund Covered', val: `500 ${t.jod}`, color: DS.colors.success },
                  { label: isRtl ? 'رصيد الصندوق' : 'Fund Balance', val: `${jam.insuranceFund} ${t.jod}`, color: DS.colors.gold },
                  { label: isRtl ? 'خسارتك' : 'Your Loss', val: isRtl ? 'صفر' : 'Zero', color: DS.colors.success },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: DS.radii.sm, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '10px 12px', background: `${DS.colors.success}20`, borderRadius: DS.radii.sm, border: `1px solid ${DS.colors.success}40` }}>
                <span style={{ color: DS.colors.success, fontSize: 12, fontWeight: 600 }}>
                  ✓ {isRtl ? 'لم تخسر فلساً واحداً — صندوق التأمين حمى الجميع.' : 'You lost nothing — the Insurance Fund protected everyone.'}
                </span>
              </div>
            </div>
          )}
        </div>

        <AppButton variant="gold" size="lg" style={{ width: '100%', maxWidth: 380, justifyContent: 'center' }}
          onClick={() => setScreen('dashboard')}>
          {isRtl ? 'العودة إلى الرئيسية' : 'Back to Dashboard'}
        </AppButton>
      </div>

      <style>{`
        @keyframes fall { from { transform: translateY(-20px) rotate(0deg); opacity:1; } to { transform: translateY(110vh) rotate(720deg); opacity:0; } }
        @keyframes orbit { from { transform: translate(-50%,-50%) translate(var(--ox,0),var(--oy,0)) rotate(0deg) translateX(110px); } to { transform: translate(-50%,-50%) rotate(360deg) translateX(110px); } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

Object.assign(window, { CreateScreen, DetailScreen, PaymentScreen });
