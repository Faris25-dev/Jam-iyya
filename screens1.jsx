// screens1.jsx — Landing + Onboarding

// ===== LANDING SCREEN =====
function LandingScreen({ nav }) {
  const { setScreen, lang, setLang } = nav;
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  const [count1, setCount1] = React.useState(0);
  const [count2, setCount2] = React.useState(0);
  const [count3, setCount3] = React.useState(0);

  React.useEffect(() => {
    const animate = (target, setter, dur) => {
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 2.5);
        setter(Math.round(e * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 400);
    };
    animate(50, setCount1, 1600);
    animate(31, setCount2, 1400);
    animate(70, setCount3, 1800);
  }, []);

  const features = isRtl ? [
    { icon: '◈', title: 'درجة ثقة بالذكاء الاصطناعي', desc: 'كل عضو يحصل على درجة ثقة من 0 إلى 1000 محسوبة بخوارزمية ذكية تضمن أمان الجميع' },
    { icon: '◉', title: 'حساب ضمان آمن', desc: 'أموالك لا تُحوَّل مباشرة — بل تُودَع في حساب ضمان محمي وتُصرف تلقائياً في الموعد المحدد' },
    { icon: '◇', title: 'صندوق تأمين جماعي', desc: 'كل جمعية تُودِع نسبة صغيرة في صندوق تأمين مشترك يضمن عدم خسارة أي عضو حتى لو تخلّف أحدهم' },
  ] : [
    { icon: '◈', title: 'AI Trust Score', desc: 'Every member gets a 0–1000 trust score calculated by our smart algorithm — ensuring everyone is verified and accountable' },
    { icon: '◉', title: 'Smart Escrow', desc: 'Money is never transferred peer-to-peer — it sits in a protected escrow account and auto-releases on schedule' },
    { icon: '◇', title: 'Collective Insurance', desc: 'Every circle contributes a small % to a shared insurance fund that covers defaults — no one ever loses their savings' },
  ];

  const steps = isRtl ? [
    { n: '١', title: 'سجّل وتحقق', desc: 'تحقق من هويتك واحصل على درجة ثقتك الأولية خلال دقائق' },
    { n: '٢', title: 'انضم أو أنشئ', desc: 'اختر جمعية من السوق أو ادعُ أصدقاءك لبدء جمعية خاصة' },
    { n: '٣', title: 'ادّخر واستلم', desc: 'يتم الخصم تلقائياً كل شهر وتستلم دورك في الموعد المحدد' },
  ] : [
    { n: '1', title: 'Sign Up & Verify', desc: 'Verify your identity and get your initial trust score in minutes' },
    { n: '2', title: 'Join or Create', desc: 'Browse the marketplace or invite friends to start a private circle' },
    { n: '3', title: 'Save & Receive', desc: 'Monthly contributions are automatic — receive your payout on schedule' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, fontFamily: 'inherit' }} data-screen-label="Landing">
      {/* Hero */}
      <div style={{ position: 'relative', background: DS.colors.navy, overflow: 'hidden', padding: '0 0 60px' }}>
        <GeoBg opacity={0.07} />
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>{t.appName}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
              {lang==='ar'?'EN':'ع'}
            </button>
            <AppButton variant="secondary" size="sm" onClick={() => setScreen('onboarding')}
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}>
              {t.signIn}
            </AppButton>
          </div>
        </div>

        {/* Hero Content */}
        <div style={{ textAlign: 'center', padding: '40px 24px 20px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-block', background: `${DS.colors.gold}20`, border: `1px solid ${DS.colors.gold}40`, borderRadius: 999, padding: '4px 14px', marginBottom: 20 }}>
            <span style={{ color: DS.colors.gold, fontSize: 12, fontWeight: 700 }}>{isRtl ? '✦ منصة الادخار الجماعي الذكية' : '✦ Smart Collective Savings Platform'}</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: isRtl ? 'clamp(28px,7vw,52px)' : 'clamp(26px,6vw,48px)', fontWeight: 900, lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            {isRtl ? <>الجمعية التقليدية<br /><span style={{ color: DS.colors.gold }}>بقوة الذكاء الاصطناعي</span></> : <>Traditional Savings Circles<br /><span style={{ color: DS.colors.gold }}>Powered by AI</span></>}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 32px' }}>
            {isRtl ? 'انضم إلى ملايين العرب الذين يدّخرون معاً — بأمان تام، وشفافية كاملة، وضمان ضد أي تقصير' : "Join millions of Arabs saving together — fully secure, transparent, and protected against defaults"}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <AppButton variant="gold" size="lg" onClick={() => setScreen('onboarding')}>
              {t.signUp}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points={isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
              </svg>
            </AppButton>
            <AppButton variant="secondary" size="lg" onClick={() => setScreen('dashboard')}
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)' }}>
              {isRtl ? 'شاهد العرض' : 'See Demo'}
            </AppButton>
          </div>
        </div>

        {/* Floating app preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, position: 'relative', zIndex: 2 }}>
          <div style={{ width: 200, background: 'rgba(255,255,255,0.06)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.12)', padding: 16, backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{isRtl ? 'درجة الثقة' : 'Trust Score'}</span>
              <TierBadge score={720} lang={lang} />
            </div>
            <TrustGauge score={720} size={120} animated={true} showLabel={false} />
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              {[200, 500, 300].map((a, i) => (
                <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                  <div style={{ color: DS.colors.gold, fontSize: 12, fontWeight: 700 }}>{a}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{t.jod}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', maxWidth: 600, margin: '0 auto' }}>
          {[
            { val: `${count1}%`, label: isRtl ? 'من العرب يستخدمون الجمعيات' : 'of Arabs use savings circles' },
            { val: `$${count2}M`, label: isRtl ? 'تمويل MoneyFellows' : 'raised by MoneyFellows' },
            { val: `${count3}%`, label: isRtl ? 'من المستخدمين نساء' : 'of users are women' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '24px 12px', textAlign: 'center', borderInlineEnd: i < 2 ? `1px solid ${DS.colors.border}` : 'none' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: DS.colors.navy, letterSpacing: '-0.02em' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: DS.colors.muted, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: DS.colors.navy, margin: '0 0 8px' }}>
            {isRtl ? 'ثلاثة أعمدة للثقة' : 'Three Pillars of Trust'}
          </h2>
          <p style={{ color: DS.colors.muted, fontSize: 15 }}>{isRtl ? 'تقنية متطورة تحمي مدخراتك' : 'Advanced technology protecting your savings'}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map((f, i) => (
            <Card key={i} style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: DS.colors.goldBg, color: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: DS.colors.navy, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: DS.colors.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: DS.colors.navy, padding: '48px 24px', position: 'relative', overflow: 'hidden' }}>
        <GeoBg opacity={0.05} />
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 32 }}>
            {isRtl ? 'كيف يعمل النظام؟' : 'How It Works'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.gold, color: '#fff', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: DS.colors.navy, marginBottom: 12 }}>
          {isRtl ? 'ابدأ رحلة الادخار اليوم' : 'Start Saving Together Today'}
        </h2>
        <p style={{ color: DS.colors.muted, marginBottom: 28, fontSize: 15 }}>
          {isRtl ? 'انضم إلى آلاف الأسر العربية التي تدّخر بأمان' : 'Join thousands of Arab families saving safely'}
        </p>
        <AppButton variant="gold" size="lg" onClick={() => setScreen('onboarding')} style={{ marginBottom: 12 }}>
          {t.signUp} — {isRtl ? 'مجاناً' : 'Free'}
        </AppButton>
        <div style={{ fontSize: 12, color: DS.colors.muted, marginTop: 12 }}>
          {isRtl ? 'لا رسوم إنشاء · آمن ومرخّص · شريعة إسلامية' : 'No setup fees · Secure & licensed · Sharia-compliant'}
        </div>
      </div>
    </div>
  );
}

// ===== ONBOARDING SCREEN =====
function OnboardingScreen({ nav }) {
  const { setScreen, setUser, lang, setLang } = nav;
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  const [step, setStep] = React.useState(0); // 0=phone, 1=otp, 2=id, 3=calculating, 4=reveal
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState(['', '', '', '']);
  const [calcStep, setCalcStep] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [revealScore, setRevealScore] = React.useState(false);

  const calcSteps = isRtl ? [
    'التحقق من الهوية الوطنية...',
    'تحليل الوجه بالذكاء الاصطناعي...',
    'فحص السجل المالي...',
    'حساب عوامل الثقة...',
    'إنشاء ملف الثقة...',
  ] : [
    'Verifying National ID...',
    'AI facial analysis...',
    'Checking financial history...',
    'Computing trust factors...',
    'Building trust profile...',
  ];

  React.useEffect(() => {
    if (step === 3) {
      let i = 0;
      const iv = setInterval(() => {
        setCalcStep(i);
        i++;
        if (i >= calcSteps.length) {
          clearInterval(iv);
          setTimeout(() => setStep(4), 600);
        }
      }, 600);
      return () => clearInterval(iv);
    }
    if (step === 4) {
      setTimeout(() => setRevealScore(true), 300);
    }
  }, [step]);

  const handleOtp = (val, idx) => {
    const next = [...otp]; next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 3) document.getElementById(`otp-${idx+1}`)?.focus();
    if (next.every(v => v)) setTimeout(() => setStep(2), 300);
  };

  const finalScore = 320;

  const steps = [
    { label: isRtl ? 'الهاتف' : 'Phone', done: step > 0 },
    { label: isRtl ? 'التحقق' : 'Verify', done: step > 1 },
    { label: isRtl ? 'الهوية' : 'ID', done: step > 2 },
    { label: isRtl ? 'النتيجة' : 'Score', done: step > 4 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, display: 'flex', flexDirection: 'column' }} data-screen-label="Onboarding">
      {/* Header */}
      <div style={{ background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>{t.appName}</span>
        </div>
        <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
          style={{ background: DS.colors.mutedLight, border: 'none', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: DS.colors.navy, fontFamily: 'inherit' }}>
          {lang==='ar'?'EN':'ع'}
        </button>
      </div>

      {/* Step Indicator */}
      {step < 4 && (
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: step >= i ? DS.colors.navy : DS.colors.mutedLight, color: step >= i ? '#fff' : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, transition: 'all 0.3s' }}>
                    {step > i ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, color: step >= i ? DS.colors.navy : DS.colors.muted, fontWeight: step === i ? 700 : 400 }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > i ? DS.colors.navy : DS.colors.mutedLight, margin: '0 4px', marginBottom: 18, transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', maxWidth: 420, margin: '0 auto', width: '100%' }}>

        {/* Step 0: Phone */}
        {step === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{t.verifyPhone}</h2>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              {isRtl ? 'أدخل رقم هاتفك لبدء إنشاء حسابك الآمن' : 'Enter your phone number to create your secure account'}
            </p>
            <label style={{ fontSize: 13, color: DS.colors.muted, fontWeight: 600, marginBottom: 6, display: 'block' }}>{isRtl ? 'رقم الهاتف' : 'Phone Number'}</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ background: DS.colors.mutedLight, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontWeight: 600, color: DS.colors.navy, flexShrink: 0 }}>+962</div>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={isRtl ? '٧٩ *** ****' : '79 *** ****'}
                style={{ flex: 1, background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none' }} />
            </div>
            <AppButton variant="primary" size="lg" onClick={() => setStep(1)} disabled={phone.length < 7} style={{ width: '100%', justifyContent: 'center' }}>
              {t.continue}
            </AppButton>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: DS.colors.muted }}>
              {isRtl ? 'لديك حساب؟' : 'Have an account?'}{' '}
              <button onClick={() => setScreen('dashboard')} style={{ background: 'none', border: 'none', color: DS.colors.navy, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>{t.signIn}</button>
            </div>
          </div>
        )}

        {/* Step 1: OTP */}
        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{isRtl ? 'رمز التحقق' : 'Verification Code'}</h2>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
              {t.enterOtp} <strong style={{ color: DS.colors.navy }}>+962 {phone}</strong>
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, direction: 'ltr' }}>
              {otp.map((v, i) => (
                <input key={i} id={`otp-${i}`} value={v} maxLength={1}
                  onChange={e => handleOtp(e.target.value, i)}
                  style={{ width: 56, height: 64, textAlign: 'center', fontSize: 24, fontWeight: 800, border: `2px solid ${v ? DS.colors.navy : DS.colors.border}`, borderRadius: DS.radii.md, background: DS.colors.card, color: DS.colors.navy, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' }} />
              ))}
            </div>
            <div style={{ background: DS.colors.successLight, borderRadius: DS.radii.md, padding: '12px 16px', marginBottom: 24, textAlign: 'center' }}>
              <span style={{ color: DS.colors.success, fontSize: 13, fontWeight: 600 }}>
                {isRtl ? '✓ تجريبي: أدخل أي أرقام للمتابعة' : '✓ Demo: enter any digits to continue'}
              </span>
            </div>
            <AppButton variant="ghost" size="md" style={{ justifyContent: 'center', color: DS.colors.muted }}>
              {isRtl ? 'إعادة إرسال الرمز' : 'Resend code'}
            </AppButton>
          </div>
        )}

        {/* Step 2: ID Upload */}
        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{t.uploadId}</h2>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {isRtl ? 'حمّل صورة هويتك الوطنية وصورتك الشخصية لنتحقق من هويتك' : 'Upload your National ID and selfie to verify your identity'}
            </p>

            {[
              { icon: '▣', label: isRtl ? 'الوجه الأمامي للهوية' : 'ID Front Side', sub: isRtl ? 'JPG أو PNG' : 'JPG or PNG' },
              { icon: '◈', label: isRtl ? 'الوجه الخلفي للهوية' : 'ID Back Side', sub: isRtl ? 'JPG أو PNG' : 'JPG or PNG' },
              { icon: '◉', label: isRtl ? 'صورة شخصية (سيلفي)' : 'Selfie Photo', sub: isRtl ? 'ستُطابق مع الهوية' : 'Will be matched with ID' },
            ].map((item, i) => (
              <div key={i} style={{ border: `1.5px dashed ${DS.colors.borderStrong}`, borderRadius: DS.radii.lg, padding: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: DS.colors.card, transition: 'border-color 0.2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: DS.colors.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: DS.colors.gold, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: DS.colors.navy }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: DS.colors.muted }}>{item.sub}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: DS.colors.mutedLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.colors.muted }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
              </div>
            ))}

            <div style={{ background: `${DS.colors.navy}08`, borderRadius: DS.radii.md, padding: '12px 16px', marginBottom: 24, marginTop: 4 }}>
              <div style={{ fontSize: 12, color: DS.colors.muted, lineHeight: 1.6 }}>
                {isRtl ? '🔒 بياناتك محمية بتشفير من طرف إلى طرف. لن نشاركها مع أي طرف ثالث.' : '🔒 Your data is end-to-end encrypted. We never share it with third parties.'}
              </div>
            </div>

            <AppButton variant="primary" size="lg" onClick={() => setStep(3)} style={{ width: '100%', justifyContent: 'center' }}>
              {isRtl ? 'تحليل الهوية بالذكاء الاصطناعي' : 'Analyze with AI'}
            </AppButton>
          </div>
        )}

        {/* Step 3: Calculating */}
        {step === 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: DS.colors.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, fontSize: 32, position: 'relative' }}>
              <span style={{ color: DS.colors.gold }}>◈</span>
              <div style={{ position: 'absolute', inset: -4, borderRadius: 28, border: `2px solid ${DS.colors.gold}40`, animation: 'spin 2s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DS.colors.navy, marginBottom: 8 }}>{t.calculating}</h2>
            <p style={{ color: DS.colors.muted, fontSize: 14, marginBottom: 32 }}>
              {isRtl ? 'نقوم بتحليل بياناتك لإنشاء ملف ثقتك الشخصي' : 'Analyzing your data to build your personal trust profile'}
            </p>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {calcSteps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: DS.radii.md, background: calcStep >= i ? DS.colors.successLight : DS.colors.mutedLight, transition: 'background 0.4s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 999, background: calcStep > i ? DS.colors.success : calcStep === i ? DS.colors.gold : DS.colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.4s' }}>
                    {calcStep > i ? <span style={{ color: '#fff', fontSize: 10 }}>✓</span> : calcStep === i ? <div style={{ width: 8, height: 8, borderRadius: 999, background: '#fff', animation: 'pulse 1s infinite' }} /> : null}
                  </div>
                  <span style={{ fontSize: 13, color: calcStep >= i ? DS.colors.success : DS.colors.muted, fontWeight: calcStep === i ? 700 : 400 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Reveal */}
        {step === 4 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ background: DS.colors.goldBg, color: DS.colors.gold, borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>✦ {t.scoreReveal}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.colors.navy, margin: '16px 0 28px' }}>
              {t.congratsScore}
            </h2>

            {revealScore && <TrustGauge score={finalScore} size={200} animated={true} />}

            <div style={{ marginTop: 28, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: isRtl ? 'التحقق من الهوية' : 'Identity Verification', pts: '+200', done: true },
                { label: isRtl ? 'مطابقة الصورة الشخصية' : 'Selfie Match', pts: '+100', done: true },
                { label: isRtl ? 'عمر رقم الهاتف' : 'Phone Age', pts: '+20', done: true },
                { label: isRtl ? 'ربط الحساب البنكي' : 'Bank Account Link', pts: '+150', done: false },
                { label: isRtl ? 'الدخل الموثق' : 'Verified Income', pts: '+100', done: false },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: DS.radii.md, background: item.done ? DS.colors.successLight : DS.colors.mutedLight }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14 }}>{item.done ? '✓' : '○'}</span>
                    <span style={{ fontSize: 13, color: item.done ? DS.colors.success : DS.colors.muted, fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.done ? DS.colors.success : DS.colors.muted }}>{item.pts}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, padding: '12px 16px', background: DS.colors.goldBg, borderRadius: DS.radii.md, width: '100%', textAlign: 'start' }}>
              <div style={{ fontSize: 12, color: DS.colors.gold, fontWeight: 700, marginBottom: 4 }}>
                {isRtl ? '💡 كيف ترفع درجتك؟' : '💡 How to raise your score?'}
              </div>
              <div style={{ fontSize: 12, color: DS.colors.muted, lineHeight: 1.5 }}>
                {isRtl ? 'ارفع درجتك إلى فضي بربط حسابك البنكي والدفع في الموعد' : 'Reach Silver tier by linking your bank account and paying on time'}
              </div>
            </div>

            <AppButton variant="gold" size="lg" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}
              onClick={() => { setUser(MOCK_USER); setScreen('dashboard'); }}>
              {t.goToDashboard}
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

Object.assign(window, { LandingScreen, OnboardingScreen });
