// Mock Data for Development
export interface JamMember {
  nameAr: string;
  nameEn: string;
  turn: number;
  paid: boolean;
  received: boolean;
  initials: string;
  isLate?: boolean;
  isYou?: boolean;
}

export interface Jam {
  id: number;
  nameAr: string;
  nameEn: string;
  amount: number;
  totalMembers: number;
  duration: number;
  minScore: number;
  type: string;
  theme: string;
  currentMonth: number;
  yourTurn: number;
  status: string;
  avgScore: number;
  organizerAr: string;
  organizerEn: string;
  descriptionAr: string;
  descriptionEn: string;
  insuranceFund: number;
  totalPot: number;
  members: JamMember[];
  slots?: number;
}

export const MOCK_USER = {
  nameAr: 'نور الحسيني',
  nameEn: 'Nour Al-Husseini',
  phone: '+962 79 123 4567',
  trustScore: 520,
  walletBalance: 4800,
  avatar: 'نو',
  avatarEn: 'NH',
};

export const MOCK_JAMS: Jam[] = [
  {
    id: 1,
    nameAr: 'صندوق الزفاف',
    nameEn: 'Wedding Fund',
    amount: 200,
    totalMembers: 12,
    duration: 12,
    minScore: 400,
    type: 'public',
    theme: 'wedding',
    currentMonth: 4,
    yourTurn: 8,
    status: 'active',
    avgScore: 580,
    organizerAr: 'سارة عبدالله',
    organizerEn: 'Sara Abdullah',
    descriptionAr: 'جمعية لتوفير تكاليف الزفاف بطريقة منظمة وآمنة',
    descriptionEn: 'Save for wedding expenses in an organized, secure way',
    insuranceFund: 480,
    totalPot: 2400,
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
    id: 2,
    nameAr: 'رأس المال التجاري',
    nameEn: 'Business Capital',
    amount: 500,
    totalMembers: 10,
    duration: 10,
    minScore: 600,
    type: 'public',
    theme: 'business',
    currentMonth: 2,
    yourTurn: 3,
    status: 'active',
    avgScore: 720,
    organizerAr: 'خالد مصطفى',
    organizerEn: 'Khalid Mustafa',
    descriptionAr: 'جمعية لأصحاب الأعمال لتمويل رأس المال التشغيلي',
    descriptionEn: 'A circle for business owners to fund operating capital',
    insuranceFund: 1000,
    totalPot: 5000,
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

export const MARKETPLACE_JAMS: Jam[] = [
  ...MOCK_JAMS,
  {
    id: 3,
    nameAr: 'مدخرات الحج ٢٠٢٧',
    nameEn: 'Hajj Savings 2027',
    amount: 300,
    totalMembers: 15,
    duration: 18,
    minScore: 500,
    type: 'public',
    theme: 'hajj',
    currentMonth: 0,
    yourTurn: 0,
    status: 'recruiting',
    avgScore: 650,
    organizerAr: 'محمد الزعبي',
    organizerEn: 'Mohammad Al-Zuabi',
    descriptionAr: 'ادخر لأداء فريضة الحج بطريقة منظمة ومضمونة',
    descriptionEn: 'Save for the Hajj pilgrimage in a guaranteed, organized way',
    insuranceFund: 810,
    totalPot: 5400,
    members: [],
    slots: 7,
  },
  {
    id: 4,
    nameAr: 'دفعة السكن',
    nameEn: 'Home Down Payment',
    amount: 1000,
    totalMembers: 8,
    duration: 8,
    minScore: 700,
    type: 'semi-public',
    theme: 'home',
    currentMonth: 0,
    yourTurn: 0,
    status: 'recruiting',
    avgScore: 810,
    organizerAr: 'رنا السلطي',
    organizerEn: 'Rana Al-Sulti',
    descriptionAr: 'لمن يرغب في ادخار الدفعة الأولى لمنزله الأول',
    descriptionEn: 'For those saving towards their first home down payment',
    insuranceFund: 1600,
    totalPot: 8000,
    members: [],
    slots: 3,
  },
  {
    id: 5,
    nameAr: 'هدايا العيد',
    nameEn: 'Eid Gifts Circle',
    amount: 50,
    totalMembers: 6,
    duration: 6,
    minScore: 100,
    type: 'public',
    theme: 'eid',
    currentMonth: 0,
    yourTurn: 0,
    status: 'recruiting',
    avgScore: 380,
    organizerAr: 'هالة جابر',
    organizerEn: 'Hala Jaber',
    descriptionAr: 'جمعية صغيرة للمبتدئين لادخار مصروف العيد',
    descriptionEn: 'Small beginner circle for Eid spending money',
    insuranceFund: 60,
    totalPot: 300,
    members: [],
    slots: 2,
  },
];

export interface ChatMessage {
  id: number;
  senderAr: string;
  senderEn: string;
  textAr: string;
  textEn: string;
  time: string;
  isAI: boolean;
  isYou: boolean;
}

export const CHAT_MESSAGES_DATA: ChatMessage[] = [
  {
    id: 1,
    senderAr: 'سارة',
    senderEn: 'Sara',
    textAr: 'متى موعد الدفعة القادمة؟',
    textEn: "When's the next payment due?",
    time: '10:21',
    isAI: false,
    isYou: false,
  },
  {
    id: 2,
    senderAr: '✦ مساعد ذكي',
    senderEn: '✦ AI Assistant',
    textAr: 'موعد الدفعة القادمة هو ١ مايو ٢٠٢٦. المبلغ المستحق ٢٠٠ د.أ من كل عضو. دفع ٩ أعضاء من أصل ١٢ حتى الآن.',
    textEn: 'Next payment is due May 1, 2026. Amount: 200 JOD per member. 9 of 12 members have paid so far.',
    time: '10:21',
    isAI: true,
    isYou: false,
  },
  {
    id: 3,
    senderAr: 'خالد',
    senderEn: 'Khalid',
    textAr: '👍 شكراً',
    textEn: '👍 Thanks!',
    time: '10:23',
    isAI: false,
    isYou: false,
  },
  {
    id: 4,
    senderAr: 'أنت',
    senderEn: 'You',
    textAr: 'متى يكون دوري؟',
    textEn: 'When is my turn?',
    time: '10:25',
    isAI: false,
    isYou: true,
  },
  {
    id: 5,
    senderAr: '✦ مساعد ذكي',
    senderEn: '✦ AI Assistant',
    textAr: 'دورك في الشهر الثامن — أغسطس ٢٠٢٦. ستستلمين ٢٤٠٠ د.أ. تبقى ٤ أشهر على دورك. 🎉',
    textEn: 'Your turn is month 8 — August 2026. You will receive 2,400 JOD. 4 months remaining until your turn! 🎉',
    time: '10:25',
    isAI: true,
    isYou: false,
  },
];
