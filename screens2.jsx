// screens2.jsx — Dashboard + Marketplace

// ===== DASHBOARD SCREEN =====
function DashboardScreen({ nav }) {
  const { screen, setScreen, lang, setLang, setSelectedJam } = nav;
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  const user = nav.user || MOCK_USER;

  const greetHour = new Date().getHours();
  const greetAr = greetHour < 12 ? 'صباح الخير' : greetHour < 17 ? 'مساء الخير' : 'مساء الخير';
  const greetEn = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';

  const tier = DS.getTier(user.trustScore);
  const tData = DS.tiers[tier];

  const upcomingPayments = [
    { jamAr: 'صندوق الزفاف', jamEn: 'Wedding Fund', amount: 200, dueAr: 'يستحق ١ مايو', dueEn: 'Due May 1', color: DS.colors.gold },
    { jamAr: 'رأس المال التجاري', jamEn: 'Business Capital', amount: 500, dueAr: 'يستحق ١ مايو', dueEn: 'Due May 1', color: DS.colors.navyMid },
  ];

  const insights = isRtl ? [
    { icon: '↑', val: '٢٤٠٠ د.أ', label: 'مجموع ما ادّخرت', color: DS.colors.success },
    { icon: '◎', val: '٢', label: 'جمعيات نشطة', color: DS.colors.navy },
    { icon: '★', val: '٤', label: 'أشهر لدورك القادم', color: DS.colors.gold },
  ] : [
    { icon: '↑', val: '2,400 JOD', label: 'Total Saved', color: DS.colors.success },
    { icon: '◎', val: '2', label: 'Active Circles', color: DS.colors.navy },
    { icon: '★', val: '4', label: 'Months to Next Turn', color: DS.colors.gold },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, paddingBottom: 90 }} data-screen-label="Dashboard">
      <TopBar title={t.dashboard} lang={lang} setLang={setLang} />

      <div style={{ padding: '20px 16px', maxWidth: 520, margin: '0 auto' }}>

        {/* Greeting + Score */}
        <Card style={{ padding: 20, marginBottom: 16, position: 'relative', background: DS.colors.navy }}>
          <GeoBg opacity={0.06} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>{isRtl ? greetAr : greetEn}</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
                {isRtl ? user.nameAr.split(' ')[0] : user.nameEn.split(' ')[0]} 👋
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{t.trustScore}</span>
                <TierBadge score={user.trustScore} lang={lang} />
              </div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{user.trustScore}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>/ 1000</div>
            </div>
            <TrustGauge score={user.trustScore} size={110} animated={false} showLabel={false} />
          </div>
          {/* Score bar */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              <span>{isRtl ? 'برونز' : 'Bronze'}</span>
              <span style={{ color: tData.color, fontWeight: 700 }}>{isRtl ? tData.ar : tData.en} · {user.trustScore}/1000</span>
              <span>{isRtl ? 'بلاتيني' : 'Platinum'}</span>
            </div>
            <ProgressBar value={user.trustScore} max={1000} color={tData.color} height={5} />
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {isRtl ? `${600 - user.trustScore} نقطة للوصول إلى الذهبي ◈` : `${600 - user.trustScore} pts to reach Gold ◈`}
            </div>
          </div>
        </Card>

        {/* Wallet + Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {insights.map((ins, i) => (
            <Card key={i} style={{ padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, color: ins.color, marginBottom: 4 }}>{ins.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: DS.colors.navy, lineHeight: 1 }}>{ins.val}</div>
              <div style={{ fontSize: 10, color: DS.colors.muted, marginTop: 3, lineHeight: 1.3 }}>{ins.label}</div>
            </Card>
          ))}
        </div>

        {/* Wallet */}
        <Card style={{ padding: 18, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: DS.colors.muted, marginBottom: 4 }}>{t.wallet} · {isRtl ? 'الرصيد' : 'Balance'}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: DS.colors.navy, letterSpacing: '-0.02em' }}>
              {user.walletBalance.toLocaleString()}
              <span style={{ fontSize: 14, fontWeight: 600, color: DS.colors.muted, marginInlineStart: 4 }}>{t.jod}</span>
            </div>
            <div style={{ fontSize: 12, color: DS.colors.success, marginTop: 4 }}>
              {isRtl ? '↑ +٢٠٠ هذا الشهر' : '↑ +200 this month'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.goldBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.colors.gold, fontSize: 18 }}>+</button>
            <button style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.mutedLight, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.colors.muted, fontSize: 18 }}>↓</button>
          </div>
        </Card>

        {/* Active Circles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>{t.myCircles}</span>
          <button onClick={() => setScreen('marketplace')} style={{ background: 'none', border: 'none', color: DS.colors.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t.viewAll}</button>
        </div>

        {MOCK_JAMS.map(jam => (
          <JamCard key={jam.id} jam={jam} lang={lang}
            onClick={() => { setSelectedJam(jam); setScreen('detail'); }} />
        ))}

        {/* Upcoming Payments */}
        <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy, marginBottom: 12, marginTop: 8 }}>
          {isRtl ? 'الدفعات القادمة' : 'Upcoming Payments'}
        </div>
        {upcomingPayments.map((p, i) => (
          <Card key={i} style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: p.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: DS.colors.navy }}>{isRtl ? p.jamAr : p.jamEn}</div>
                <div style={{ fontSize: 12, color: DS.colors.muted }}>{isRtl ? p.dueAr : p.dueEn}</div>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: DS.colors.navy }}>{p.amount} <span style={{ fontSize: 11, color: DS.colors.muted }}>{t.jod}</span></div>
          </Card>
        ))}

        {/* Payout CTA */}
        <Card hover onClick={() => setScreen('payment')}
          style={{ padding: 18, marginTop: 8, background: `linear-gradient(135deg, ${DS.colors.goldBg}, #fff)`, border: `1.5px solid ${DS.colors.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: DS.colors.navy, marginBottom: 4 }}>
              {isRtl ? '✦ شاهد يوم الصرف' : '✦ See Payout Day'}
            </div>
            <div style={{ fontSize: 12, color: DS.colors.muted }}>{isRtl ? 'عاين تجربة استلام دورك في الجمعية' : 'Preview the payout experience'}</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: DS.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><polyline points={isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'}/></svg>
          </div>
        </Card>
      </div>

      <NavBar screen={screen} setScreen={setScreen} lang={lang} />
    </div>
  );
}

// ===== MARKETPLACE SCREEN =====
function MarketplaceScreen({ nav }) {
  const { screen, setScreen, lang, setLang, setSelectedJam } = nav;
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  const [search, setSearch] = React.useState('');
  const [filterTier, setFilterTier] = React.useState('all');
  const [filterAmt, setFilterAmt] = React.useState('all');
  const [joinModal, setJoinModal] = React.useState(null);
  const [joined, setJoined] = React.useState(null);

  const tierFilters = [
    { id: 'all', ar: 'الكل', en: 'All' },
    { id: 'bronze', ar: 'برونز', en: 'Bronze' },
    { id: 'silver', ar: 'فضي', en: 'Silver' },
    { id: 'gold', ar: 'ذهبي', en: 'Gold' },
    { id: 'platinum', ar: 'بلاتيني', en: 'Platinum' },
  ];

  const amtFilters = [
    { id: 'all', ar: 'كل المبالغ', en: 'All Amounts' },
    { id: 'low', ar: 'أقل من ٢٠٠', en: 'Under 200' },
    { id: 'mid', ar: '٢٠٠ – ٥٠٠', en: '200 – 500' },
    { id: 'high', ar: 'أكثر من ٥٠٠', en: 'Over 500' },
  ];

  const filtered = MARKETPLACE_JAMS.filter(j => {
    const name = isRtl ? j.nameAr : j.nameEn;
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === 'all' || DS.getTier(j.minScore || 0) === filterTier;
    const matchAmt = filterAmt === 'all'
      || (filterAmt === 'low' && j.amount < 200)
      || (filterAmt === 'mid' && j.amount >= 200 && j.amount <= 500)
      || (filterAmt === 'high' && j.amount > 500);
    return matchSearch && matchTier && matchAmt;
  });

  const smartMatch = MARKETPLACE_JAMS.find(j => j.id === 3);

  const handleJoin = (jam) => {
    setJoinModal(null);
    setJoined(jam.id);
    setTimeout(() => setJoined(null), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.colors.bg, paddingBottom: 90 }} data-screen-label="Marketplace">
      <TopBar title={t.marketplace} lang={lang} setLang={setLang} />

      <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}
            style={{ width: '100%', background: DS.colors.card, border: `1.5px solid ${DS.colors.border}`, borderRadius: DS.radii.md, padding: isRtl ? '12px 44px 12px 14px' : '12px 14px 12px 44px', fontSize: 14, fontFamily: 'inherit', color: DS.colors.navy, outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: 14, color: DS.colors.muted }}>
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>

        {/* Tier filters */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 10, scrollbarWidth: 'none' }}>
          {tierFilters.map(f => (
            <button key={f.id} onClick={() => setFilterTier(f.id)}
              style={{ flexShrink: 0, background: filterTier === f.id ? DS.colors.navy : DS.colors.card, color: filterTier === f.id ? '#fff' : DS.colors.muted, border: `1px solid ${filterTier === f.id ? DS.colors.navy : DS.colors.border}`, borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {isRtl ? f.ar : f.en}
            </button>
          ))}
        </div>

        {/* Amount filters */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
          {amtFilters.map(f => (
            <button key={f.id} onClick={() => setFilterAmt(f.id)}
              style={{ flexShrink: 0, background: filterAmt === f.id ? DS.colors.goldBg : DS.colors.card, color: filterAmt === f.id ? DS.colors.gold : DS.colors.muted, border: `1px solid ${filterAmt === f.id ? DS.colors.gold : DS.colors.border}`, borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {isRtl ? f.ar : f.en}
            </button>
          ))}
        </div>

        {/* AI Smart Match */}
        {!search && smartMatch && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: DS.colors.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: DS.colors.gold }}>✦</div>
              <span style={{ fontWeight: 800, fontSize: 14, color: DS.colors.navy }}>{t.smartMatch}</span>
              <span style={{ fontSize: 11, color: DS.colors.muted }}>
                {isRtl ? '— مقترح بناءً على ملفك' : '— Suggested for your profile'}
              </span>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${DS.colors.navy} 0%, ${DS.colors.navyMid} 100%)`, borderRadius: DS.radii.lg, padding: 18, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => { setSelectedJam(smartMatch); setScreen('detail'); }}>
              <GeoBg opacity={0.06} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>◉</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{isRtl ? smartMatch.nameAr : smartMatch.nameEn}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        {smartMatch.totalMembers} {t.members} · {smartMatch.duration} {t.month}{!isRtl&&'s'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: isRtl ? 'start' : 'end' }}>
                    <div style={{ fontWeight: 900, fontSize: 22, color: DS.colors.gold }}>{smartMatch.amount}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.jod}{t.monthly}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: DS.radii.md, padding: '8px 12px', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    {isRtl ? `✦ مثالية لملفك — متوسط درجة الثقة ${smartMatch.avgScore} · ${smartMatch.slots} مقاعد متبقية` : `✦ Perfect for your profile — avg trust score ${smartMatch.avgScore} · ${smartMatch.slots} spots left`}
                  </span>
                </div>
                <AppButton variant="gold" size="sm" onClick={e => { e.stopPropagation(); setJoinModal(smartMatch); }}>
                  {t.join}
                </AppButton>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ fontWeight: 700, fontSize: 13, color: DS.colors.muted, marginBottom: 12 }}>
          {filtered.length} {isRtl ? 'جمعية متاحة' : 'circles available'}
        </div>

        {filtered.map(jam => (
          <JamCard key={jam.id} jam={jam} lang={lang}
            onClick={() => { setSelectedJam(jam); setScreen('detail'); }}
            showJoin={jam.status === 'recruiting'}
            onJoin={j => setJoinModal(j)} />
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12, color: DS.colors.muted }}>◎</div>
            <div style={{ color: DS.colors.muted, fontSize: 15 }}>{isRtl ? 'لا نتائج مطابقة' : 'No matching circles'}</div>
          </div>
        )}
      </div>

      {/* Join Modal */}
      {joinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,60,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setJoinModal(null)}>
          <div style={{ background: DS.colors.card, borderRadius: `${DS.radii.xl}px ${DS.radii.xl}px 0 0`, padding: '28px 24px 40px', width: '100%', maxWidth: 480 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: DS.colors.mutedLight, margin: '0 auto 24px', display: 'block' }} />
            <h3 style={{ fontWeight: 800, fontSize: 19, color: DS.colors.navy, marginBottom: 6 }}>
              {isRtl ? joinModal.nameAr : joinModal.nameEn}
            </h3>
            <p style={{ color: DS.colors.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {isRtl ? joinModal.descriptionAr : joinModal.descriptionEn}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: t.amount, val: `${joinModal.amount} ${t.jod}${t.monthly}` },
                { label: t.duration, val: `${joinModal.duration} ${t.month}${!isRtl&&joinModal.duration>1?'s':''}` },
                { label: isRtl ? 'إجمالي الصندوق' : 'Total Pot', val: `${joinModal.amount * joinModal.totalMembers} ${t.jod}` },
                { label: t.minScore, val: joinModal.minScore },
              ].map((item, i) => (
                <div key={i} style={{ background: DS.colors.bg, borderRadius: DS.radii.md, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: DS.colors.muted, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DS.colors.navy }}>{item.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: DS.colors.successLight, borderRadius: DS.radii.md, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: DS.colors.success, fontSize: 18 }}>◈</span>
              <span style={{ fontSize: 13, color: DS.colors.success, fontWeight: 600 }}>
                {isRtl ? `درجة ثقتك ${MOCK_USER.trustScore} — مؤهل للانضمام ✓` : `Your score ${MOCK_USER.trustScore} — eligible to join ✓`}
              </span>
            </div>
            <AppButton variant="gold" size="lg" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => handleJoin(joinModal)}>
              {t.join}
            </AppButton>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {joined && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: DS.colors.success, color: '#fff', borderRadius: DS.radii.md, padding: '12px 24px', fontWeight: 700, fontSize: 14, zIndex: 300, boxShadow: DS.shadow.lg, whiteSpace: 'nowrap', animation: 'slideUp 0.3s ease' }}>
          {isRtl ? '✓ تم الانضمام بنجاح!' : '✓ Successfully joined!'}
        </div>
      )}

      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      <NavBar screen={screen} setScreen={setScreen} lang={lang} />
    </div>
  );
}

Object.assign(window, { DashboardScreen, MarketplaceScreen });
