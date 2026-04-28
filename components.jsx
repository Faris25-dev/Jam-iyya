// components.jsx — Jam'iyya AI Design System + Mock Data

const DS = {
  colors: {
    bg: '#F7F5F0', card: '#FFFFFF', navy: '#0D1F3C', navyMid: '#1A3A6B',
    gold: '#C4963E', goldLight: '#F0DFA0', goldBg: '#FBF4E0',
    muted: '#6B7A99', mutedLight: '#E8EAF0',
    border: 'rgba(13,31,60,0.08)', borderStrong: 'rgba(13,31,60,0.16)',
    success: '#1A7A50', successLight: '#E6F4EE',
    error: '#B93B2B', errorLight: '#FBE9E7',
    bronze: '#B87333', bronzeBg: '#FAEEE3',
    silver: '#9EA3A8', silverBg: '#F0F1F2',
    goldTier: '#C4963E', goldTierBg: '#FBF4E0',
    platinum: '#8B7CB6', platinumBg: '#F0EDF8',
  },
  radii: { sm: 8, md: 14, lg: 20, xl: 28 },
  shadow: {
    sm: '0 1px 4px rgba(13,31,60,0.06)',
    md: '0 4px 16px rgba(13,31,60,0.09)',
    lg: '0 8px 32px rgba(13,31,60,0.13)',
    gold: '0 4px 20px rgba(196,150,62,0.28)',
  },
  tiers: {
    bronze: { ar: 'برونز', en: 'Bronze', color: '#B87333', bg: '#FAEEE3', range: '100–400' },
    silver: { ar: 'فضي', en: 'Silver', color: '#9EA3A8', bg: '#F0F1F2', range: '400–600' },
    gold: { ar: 'ذهبي', en: 'Gold', color: '#C4963E', bg: '#FBF4E0', range: '600–800' },
    platinum: { ar: 'بلاتيني', en: 'Platinum', color: '#8B7CB6', bg: '#F0EDF8', range: '800–1000' },
  },
  getTier: (s) => s < 400 ? 'bronze' : s < 600 ? 'silver' : s < 800 ? 'gold' : 'platinum',
};

const STRINGS = {
  ar: {
    appName: 'جمعية AI', tagline: 'دوائر الادخار الذكية',
    dashboard: 'الرئيسية', marketplace: 'السوق', myCircles: 'جمعياتي',
    create: 'أنشئ', trustScore: 'درجة الثقة', wallet: 'المحفظة',
    balance: 'الرصيد', continue: 'متابعة', back: 'رجوع',
    join: 'انضم الآن', signUp: 'إنشاء حساب', signIn: 'تسجيل الدخول',
    jod: 'د.أ', month: 'شهر', monthly: '/شهر', members: 'عضو',
    turn: 'الدور', yourTurn: 'دورك القادم', viewAll: 'عرض الكل',
    search: 'ابحث في السوق...', filter: 'تصفية', send: 'إرسال',
    askAI: 'اسأل المساعد الذكي...', paid: 'مدفوع', pending: 'معلق',
    late: 'متأخر', active: 'نشط', completed: 'مكتمل',
    private: 'خاص', semiPublic: 'شبه عام', public: 'عام',
    amount: 'المبلغ', duration: 'المدة', minScore: 'أدنى درجة ثقة',
    smartMatch: 'تطابق ذكي', insurance: 'صندوق التأمين',
    confettiMsg: '!مبروك! استلمت دورك',
    verifyPhone: 'تحقق من هاتفك', uploadId: 'تحميل الهوية الوطنية',
    takeSelfie: 'التقاط صورة شخصية', scoreReveal: 'درجة ثقتك الأولية',
    enterOtp: 'أدخل رمز التحقق المرسل إلى',
    analyzeId: '...جاري تحليل هويتك بالذكاء الاصطناعي',
    calculating: '...جاري حساب درجة ثقتك',
    congratsScore: '!أهلاً بك في جمعية AI',
    goToDashboard: 'الذهاب إلى الرئيسية',
    payoutMsg: '!يوم الصرف وصل',
    insuranceKickedIn: 'تدخّل صندوق التأمين',
    defaultMsg: 'عضو تأخر عن الدفع — غطّى صندوق التأمين الفرق تلقائياً وتلقائياً',
    slots: 'مقاعد متبقية', slotsUnit: '',
    step: 'الخطوة', of: 'من',
    typeCircle: 'نوع الجمعية', detailsCircle: 'تفاصيل الجمعية',
    allocationCircle: 'توزيع الأدوار', inviteCircle: 'دعوة الأعضاء',
    name: 'الاسم', desc: 'الوصف', nextMonth: 'الشهر القادم',
    totalPot: 'إجمالي الصندوق',
    insuranceFund: 'صندوق التأمين',
    myTurn: 'دوري',
    paidMembers: 'أعضاء دفعوا',
    groupChat: 'المحادثة الجماعية',
    paymentTimeline: 'جدول المدفوعات',
    you: 'أنت',
    received: 'استلم',
  },
  en: {
    appName: "Jam'iyya AI", tagline: 'Smart Savings Circles',
    dashboard: 'Home', marketplace: 'Marketplace', myCircles: 'My Circles',
    create: 'Create', trustScore: 'Trust Score', wallet: 'Wallet',
    balance: 'Balance', continue: 'Continue', back: 'Back',
    join: 'Join Now', signUp: 'Sign Up', signIn: 'Sign In',
    jod: 'JOD', month: 'month', monthly: '/mo', members: 'members',
    turn: 'Turn', yourTurn: 'Your Next Turn', viewAll: 'View All',
    search: 'Search marketplace...', filter: 'Filter', send: 'Send',
    askAI: 'Ask AI assistant...', paid: 'Paid', pending: 'Pending',
    late: 'Late', active: 'Active', completed: 'Completed',
    private: 'Private', semiPublic: 'Semi-Public', public: 'Public',
    amount: 'Amount', duration: 'Duration', minScore: 'Min Trust Score',
    smartMatch: 'Smart Match', insurance: 'Insurance Fund',
    confettiMsg: 'Congratulations! Your payout is here!',
    verifyPhone: 'Verify Your Phone', uploadId: 'Upload National ID',
    takeSelfie: 'Take a Selfie', scoreReveal: 'Your Initial Trust Score',
    enterOtp: 'Enter the code sent to',
    analyzeId: 'AI is analyzing your identity...',
    calculating: 'Calculating your trust score...',
    congratsScore: "Welcome to Jam'iyya AI!",
    goToDashboard: 'Go to Dashboard',
    payoutMsg: "Payout day is here!",
    insuranceKickedIn: 'Insurance Fund Activated',
    defaultMsg: 'A member missed their payment — our Insurance Fund covered the difference automatically',
    slots: 'spots left', slotsUnit: '',
    step: 'Step', of: 'of',
    typeCircle: 'Circle Type', detailsCircle: 'Circle Details',
    allocationCircle: 'Turn Allocation', inviteCircle: 'Invite Members',
    name: 'Name', desc: 'Description', nextMonth: 'Next Month',
    totalPot: 'Total Pot',
    insuranceFund: 'Insurance Fund',
    myTurn: 'My Turn',
    paidMembers: 'Members Paid',
    groupChat: 'Group Chat',
    paymentTimeline: 'Payment Timeline',
    you: 'You',
    received: 'Received',
  }
};

// ===== Mock Data =====
const MOCK_USER = {
  nameAr: 'نور الحسيني', nameEn: 'Nour Al-Husseini',
  phone: '+962 79 123 4567', trustScore: 520,
  walletBalance: 4800, avatar: 'نو', avatarEn: 'NH',
};

const MOCK_JAMS = [
  {
    id: 1, nameAr: 'صندوق الزفاف', nameEn: 'Wedding Fund',
    amount: 200, totalMembers: 12, duration: 12, minScore: 400,
    type: 'public', theme: 'wedding', currentMonth: 4, yourTurn: 8,
    status: 'active', avgScore: 580,
    organizerAr: 'سارة عبدالله', organizerEn: 'Sara Abdullah',
    descriptionAr: 'جمعية لتوفير تكاليف الزفاف بطريقة منظمة وآمنة',
    descriptionEn: 'Save for wedding expenses in an organized, secure way',
    insuranceFund: 480, totalPot: 2400,
    members: [
      { nameAr: 'سارة', nameEn: 'Sara', turn: 1, paid: true, received: true, initials: 'سا' },
      { nameAr: 'ليلى', nameEn: 'Layla', turn: 2, paid: true, received: true, initials: 'لي' },
      { nameAr: 'أحمد', nameEn: 'Ahmad', turn: 3, paid: true, received: true, initials: 'أح' },
      { nameAr: 'خالد', nameEn: 'Khalid', turn: 4, paid: true, received: true, initials: 'خا' },
      { nameAr: 'منى', nameEn: 'Mona', turn: 5, paid: false, received: false, initials: 'من', isLate: true },
      { nameAr: 'فهد', nameEn: 'Fahad', turn: 6, paid: true, received: false, initials: 'فه' },
      { nameAr: 'هند', nameEn: 'Hind', turn: 7, paid: true, received: false, initials: 'هن' },
      { nameAr: 'نور', nameEn: 'Nour', turn: 8, paid: true, received: false, initials: 'نو', isYou: true },
      { nameAr: 'ريم', nameEn: 'Reem', turn: 9, paid: true, received: false, initials: 'ري' },
      { nameAr: 'عمر', nameEn: 'Omar', turn: 10, paid: true, received: false, initials: 'عم' },
      { nameAr: 'دانا', nameEn: 'Dana', turn: 11, paid: false, received: false, initials: 'دا' },
      { nameAr: 'زيد', nameEn: 'Zaid', turn: 12, paid: true, received: false, initials: 'زي' },
    ],
  },
  {
    id: 2, nameAr: 'رأس المال التجاري', nameEn: 'Business Capital',
    amount: 500, totalMembers: 10, duration: 10, minScore: 600,
    type: 'public', theme: 'business', currentMonth: 2, yourTurn: 3,
    status: 'active', avgScore: 720,
    organizerAr: 'خالد مصطفى', organizerEn: 'Khalid Mustafa',
    descriptionAr: 'جمعية لأصحاب الأعمال لتمويل رأس المال التشغيلي',
    descriptionEn: 'A circle for business owners to fund operating capital',
    insuranceFund: 1000, totalPot: 5000,
    members: [
      { nameAr: 'خالد', nameEn: 'Khalid', turn: 1, paid: true, received: true, initials: 'خا' },
      { nameAr: 'أحمد', nameEn: 'Ahmad', turn: 2, paid: true, received: true, initials: 'أح' },
      { nameAr: 'نور', nameEn: 'Nour', turn: 3, paid: true, received: false, initials: 'نو', isYou: true },
      { nameAr: 'سامي', nameEn: 'Sami', turn: 4, paid: true, received: false, initials: 'سا' },
      { nameAr: 'لمى', nameEn: 'Lama', turn: 5, paid: false, received: false, initials: 'لم', isLate: true },
      { nameAr: 'ياسر', nameEn: 'Yaser', turn: 6, paid: true, received: false, initials: 'يا' },
      { nameAr: 'نادية', nameEn: 'Nadia', turn: 7, paid: true, received: false, initials: 'نا' },
      { nameAr: 'فيصل', nameEn: 'Faisal', turn: 8, paid: false, received: false, initials: 'في' },
      { nameAr: 'غدير', nameEn: 'Ghadir', turn: 9, paid: true, received: false, initials: 'غد' },
      { nameAr: 'رندة', nameEn: 'Randa', turn: 10, paid: true, received: false, initials: 'رن' },
    ],
  },
];

const MARKETPLACE_JAMS = [
  ...MOCK_JAMS,
  {
    id: 3, nameAr: 'مدخرات الحج ٢٠٢٧', nameEn: 'Hajj Savings 2027',
    amount: 300, totalMembers: 15, duration: 18, minScore: 500,
    type: 'public', theme: 'hajj', currentMonth: 0, slots: 7,
    avgScore: 650, organizerAr: 'محمد الزعبي', organizerEn: 'Mohammad Al-Zuabi',
    status: 'recruiting',
    descriptionAr: 'ادخر لأداء فريضة الحج بطريقة منظمة ومضمونة',
    descriptionEn: 'Save for the Hajj pilgrimage in a guaranteed, organized way',
    insuranceFund: 810, totalPot: 5400, members: [],
  },
  {
    id: 4, nameAr: 'دفعة السكن', nameEn: 'Home Down Payment',
    amount: 1000, totalMembers: 8, duration: 8, minScore: 700,
    type: 'semi-public', theme: 'home', currentMonth: 0, slots: 3,
    avgScore: 810, organizerAr: 'رنا السلطي', organizerEn: 'Rana Al-Sulti',
    status: 'recruiting',
    descriptionAr: 'لمن يرغب في ادخار الدفعة الأولى لمنزله الأول',
    descriptionEn: 'For those saving towards their first home down payment',
    insuranceFund: 1600, totalPot: 8000, members: [],
  },
  {
    id: 5, nameAr: 'هدايا العيد', nameEn: 'Eid Gifts Circle',
    amount: 50, totalMembers: 6, duration: 6, minScore: 100,
    type: 'public', theme: 'eid', currentMonth: 0, slots: 2,
    avgScore: 380, organizerAr: 'هالة جابر', organizerEn: 'Hala Jaber',
    status: 'recruiting',
    descriptionAr: 'جمعية صغيرة للمبتدئين لادخار مصروف العيد',
    descriptionEn: 'Small beginner circle for Eid spending money',
    insuranceFund: 60, totalPot: 300, members: [],
  },
];

const CHAT_MESSAGES_DATA = [
  { id: 1, senderAr: 'سارة', senderEn: 'Sara', textAr: 'متى موعد الدفعة القادمة؟', textEn: "When's the next payment due?", time: '10:21', isAI: false, isYou: false },
  { id: 2, senderAr: '✦ مساعد ذكي', senderEn: '✦ AI Assistant', textAr: 'موعد الدفعة القادمة هو ١ مايو ٢٠٢٦. المبلغ المستحق ٢٠٠ د.أ من كل عضو. دفع ٩ أعضاء من أصل ١٢ حتى الآن.', textEn: 'Next payment is due May 1, 2026. Amount: 200 JOD per member. 9 of 12 members have paid so far.', time: '10:21', isAI: true, isYou: false },
  { id: 3, senderAr: 'خالد', senderEn: 'Khalid', textAr: '👍 شكراً', textEn: '👍 Thanks!', time: '10:23', isAI: false, isYou: false },
  { id: 4, senderAr: 'أنت', senderEn: 'You', textAr: 'متى يكون دوري؟', textEn: 'When is my turn?', time: '10:25', isAI: false, isYou: true },
  { id: 5, senderAr: '✦ مساعد ذكي', senderEn: '✦ AI Assistant', textAr: 'دورك في الشهر الثامن — أغسطس ٢٠٢٦. ستستلمين ٢٤٠٠ د.أ. تبقى ٤ أشهر على دورك. 🎉', textEn: 'Your turn is month 8 — August 2026. You will receive 2,400 JOD. 4 months remaining until your turn! 🎉', time: '10:25', isAI: true, isYou: false },
];

// ===== Geometric Pattern =====
function GeoBg({ opacity = 0.035 }) {
  const pat = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M28 4L52 28L28 52L4 28Z' fill='none' stroke='%23C4963E' stroke-width='0.7'/%3E%3Ccircle cx='28' cy='28' r='5' fill='none' stroke='%23C4963E' stroke-width='0.7'/%3E%3Cline x1='28' y1='4' x2='28' y2='10' stroke='%23C4963E' stroke-width='0.7'/%3E%3Cline x1='52' y1='28' x2='46' y2='28' stroke='%23C4963E' stroke-width='0.7'/%3E%3Cline x1='28' y1='52' x2='28' y2='46' stroke='%23C4963E' stroke-width='0.7'/%3E%3Cline x1='4' y1='28' x2='10' y2='28' stroke='%23C4963E' stroke-width='0.7'/%3E%3C/svg%3E")`;
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity, backgroundImage: pat, backgroundSize: '56px 56px' }} />;
}

// ===== Button =====
function AppButton({ children, variant = 'primary', onClick, disabled, style, size = 'md', type = 'button' }) {
  const [hov, setHov] = React.useState(false);
  const sizes = { sm: { padding: '7px 16px', fontSize: 13 }, md: { padding: '11px 24px', fontSize: 15 }, lg: { padding: '15px 36px', fontSize: 17 } };
  const base = { borderRadius: DS.radii.md, fontFamily: 'inherit', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', outline: 'none' };
  const vars = {
    primary: { background: hov ? DS.colors.navyMid : DS.colors.navy, color: '#fff' },
    gold: { background: hov ? '#b8852e' : DS.colors.gold, color: '#fff', boxShadow: hov ? DS.shadow.gold : 'none' },
    secondary: { background: hov ? DS.colors.mutedLight : 'transparent', color: DS.colors.navy, border: `1.5px solid ${DS.colors.borderStrong}` },
    ghost: { background: hov ? DS.colors.mutedLight : 'transparent', color: DS.colors.navy },
    danger: { background: hov ? '#a03020' : DS.colors.error, color: '#fff' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...sizes[size], ...vars[variant], ...style }}>
      {children}
    </button>
  );
}

// ===== Card =====
function Card({ children, style, onClick, hover = false }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={() => hover && setHov(true)} onMouseLeave={() => hover && setHov(false)} onClick={onClick}
      style={{ background: DS.colors.card, borderRadius: DS.radii.lg, border: `1px solid ${DS.colors.border}`, boxShadow: hov ? DS.shadow.lg : DS.shadow.sm, transform: hov ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  );
}

// ===== Tier Badge =====
function TierBadge({ score, lang, size = 'sm' }) {
  const tier = DS.getTier(score);
  const t = DS.tiers[tier];
  const fs = size === 'sm' ? 11 : 13;
  return (
    <span style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}40`, borderRadius: 999, padding: size === 'sm' ? '2px 10px' : '4px 14px', fontSize: fs, fontWeight: 700 }}>
      {lang === 'ar' ? t.ar : t.en}
    </span>
  );
}

// ===== Trust Gauge =====
function TrustGauge({ score, size = 180, animated = true, showLabel = true }) {
  const [disp, setDisp] = React.useState(animated ? 0 : score);
  React.useEffect(() => {
    if (!animated) { setDisp(score); return; }
    const dur = 2000, start = Date.now();
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
  const r = size * 0.38, circ = 2 * Math.PI * r, arc = 0.75;
  const dash = circ * arc, offset = dash * (1 - disp / 1000);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)', display: 'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={DS.colors.mutedLight} strokeWidth={size*0.055} strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.color} strokeWidth={size*0.055} strokeDasharray={`${Math.max(0, dash-offset)} ${circ-Math.max(0, dash-offset)}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.08s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color: DS.colors.navy, lineHeight: 1 }}>{disp}</div>
        {showLabel && <div style={{ fontSize: size * 0.085, color: t.color, fontWeight: 700, marginTop: 3 }}>{t.ar}</div>}
        <div style={{ fontSize: size * 0.065, color: DS.colors.muted, marginTop: 2 }}>/ 1000</div>
      </div>
    </div>
  );
}

// ===== Jam'iyya Wheel =====
function JamiyyaWheel({ jam, lang, size = 300 }) {
  const { members, currentMonth } = jam;
  const cx = size / 2, cy = size / 2, R = size * 0.37, avR = size * 0.07;
  const activeIdx = members.findIndex(m => m.turn === currentMonth + 1);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {members.map((m, i) => {
        const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + R * Math.cos(angle), y = cy + R * Math.sin(angle);
        return <line key={`s${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={DS.colors.border} strokeWidth={1} />;
      })}
      {/* Center */}
      <circle cx={cx} cy={cy} r={size*0.115} fill={DS.colors.goldBg} stroke={DS.colors.gold} strokeWidth={1.5} />
      <text x={cx} y={cy-6} textAnchor="middle" fontSize={size*0.055} fontWeight={800} fill={DS.colors.navy}>{currentMonth}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize={size*0.03} fill={DS.colors.muted}>{lang==='ar'?'الشهر':'Month'}</text>

      {members.map((m, i) => {
        const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + R * Math.cos(angle), y = cy + R * Math.sin(angle);
        const isActive = m.turn === currentMonth + 1;
        const isPast = m.turn <= currentMonth;
        const fill = m.isYou ? DS.colors.navy : isPast ? DS.colors.successLight : isActive ? DS.colors.gold : DS.colors.card;
        const stroke = m.isYou ? DS.colors.navy : isActive ? DS.colors.gold : m.isLate ? DS.colors.error : DS.colors.border;
        const sw = (m.isYou || isActive || m.isLate) ? 2.5 : 1;
        const textCol = (m.isYou || isActive) ? '#fff' : isPast ? DS.colors.success : DS.colors.navy;
        const label = lang === 'ar' ? m.initials : (m.nameEn||'').substring(0,2);

        return (
          <g key={`m${i}`}>
            {isActive && <circle cx={x} cy={y} r={avR*1.6} fill={DS.colors.gold} opacity={0.12} />}
            {isActive && <circle cx={x} cy={y} r={avR*2.0} fill={DS.colors.gold} opacity={0.06} />}
            <circle cx={x} cy={y} r={avR} fill={fill} stroke={stroke} strokeWidth={sw} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={avR*0.72} fontWeight={700} fill={textCol}>{label}</text>
            <text x={x} y={y+avR+9} textAnchor="middle" fontSize={avR*0.55} fill={isPast ? DS.colors.success : DS.colors.muted} fontWeight={isPast?600:400}>{m.turn}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ===== NavBar =====
function NavBar({ screen, setScreen, lang }) {
  const t = STRINGS[lang];
  const items = [
    { id: 'dashboard', ar: 'الرئيسية', en: 'Home', icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? DS.colors.navy : 'none'} stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )},
    { id: 'marketplace', ar: 'السوق', en: 'Market', icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    )},
    { id: 'create', ar: '', en: '', icon: () => null },
    { id: 'detail', ar: 'جمعياتي', en: 'Circles', icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.navy : DS.colors.muted} strokeWidth={2}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    )},
    { id: 'payment', ar: 'الصرف', en: 'Payout', icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? DS.colors.gold : DS.colors.muted} strokeWidth={2}>
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    )},
  ];

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: DS.colors.card, borderTop: `1px solid ${DS.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0 18px', boxShadow: '0 -4px 24px rgba(13,31,60,0.08)' }}>
      {items.map(item => {
        if (item.id === 'create') return (
          <button key="create" onClick={() => setScreen('create')}
            style={{ width: 48, height: 48, borderRadius: 16, background: DS.colors.navy, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: DS.shadow.md, transform: 'translateY(-8px)' }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        );
        const active = screen === item.id;
        return (
          <button key={item.id} onClick={() => setScreen(item.id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: active ? DS.colors.navy : DS.colors.muted, fontFamily: 'inherit', fontSize: 10, fontWeight: active ? 700 : 400, padding: '4px 8px', minWidth: 50 }}>
            {item.icon(active)}
            <span>{lang === 'ar' ? item.ar : item.en}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ===== TopBar =====
function TopBar({ title, onBack, lang, setLang, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: DS.colors.card, borderBottom: `1px solid ${DS.colors.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: DS.colors.mutedLight, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.colors.navy }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points={lang==='ar'?'9 18 15 12 9 6':'15 18 9 12 15 6'}/>
            </svg>
          </button>
        )}
        <span style={{ fontWeight: 800, fontSize: 17, color: DS.colors.navy }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {right}
        <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
          style={{ background: DS.colors.mutedLight, border: 'none', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: DS.colors.navy, fontFamily: 'inherit' }}>
          {lang==='ar'?'EN':'ع'}
        </button>
      </div>
    </div>
  );
}

// ===== Progress Bar =====
function ProgressBar({ value, max, color = DS.colors.gold, height = 6 }) {
  return (
    <div style={{ background: DS.colors.mutedLight, borderRadius: 999, height, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100,(value/max)*100)}%`, background: color, height: '100%', borderRadius: 999, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ===== Jam Card =====
const THEME_MAP = {
  wedding: { bg: '#FFF0F5', icon: '◇', color: '#D06080' },
  business: { bg: '#EFF5FF', icon: '◈', color: '#3060B0' },
  hajj: { bg: '#F5F0FF', icon: '◉', color: '#7060C0' },
  home: { bg: '#F0FFF5', icon: '▣', color: '#308060' },
  eid: { bg: '#FFFBF0', icon: '✦', color: '#C08030' },
};

function JamCard({ jam, lang, onClick, showJoin, onJoin }) {
  const t = STRINGS[lang];
  const tier = DS.getTier(jam.minScore || 0);
  const tData = DS.tiers[tier];
  const th = THEME_MAP[jam.theme] || { bg: DS.colors.card, icon: '◎', color: DS.colors.navy };
  const isRtl = lang === 'ar';

  return (
    <Card hover onClick={onClick} style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, [isRtl ? 'right' : 'left']: 0, width: 3.5, background: tData.color, borderRadius: isRtl ? '0 4px 4px 0' : '4px 0 0 4px' }} />
      <div style={{ paddingInlineStart: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: th.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: th.color }}>{th.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: DS.colors.navy }}>{isRtl ? jam.nameAr : jam.nameEn}</div>
              <div style={{ fontSize: 12, color: DS.colors.muted, marginTop: 2 }}>
                {jam.totalMembers} {t.members} · {jam.duration} {t.month}{!isRtl&&jam.duration>1?'s':''}
              </div>
            </div>
          </div>
          <div style={{ textAlign: isRtl ? 'start' : 'end', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: DS.colors.navy, lineHeight: 1 }}>{jam.amount}</div>
            <div style={{ fontSize: 11, color: DS.colors.muted }}>{t.jod}{t.monthly}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <TierBadge score={jam.minScore || 0} lang={lang} />
            {jam.status === 'recruiting' && jam.slots > 0 && (
              <span style={{ background: DS.colors.successLight, color: DS.colors.success, borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                {jam.slots} {t.slots}
              </span>
            )}
          </div>
          {showJoin && (
            <AppButton variant="gold" size="sm" onClick={e => { e.stopPropagation(); onJoin && onJoin(jam); }}>{t.join}</AppButton>
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

// Export everything
Object.assign(window, {
  DS, STRINGS, MOCK_USER, MOCK_JAMS, MARKETPLACE_JAMS, CHAT_MESSAGES_DATA, THEME_MAP,
  GeoBg, AppButton, Card, TierBadge, TrustGauge, JamiyyaWheel,
  NavBar, TopBar, ProgressBar, JamCard,
});
