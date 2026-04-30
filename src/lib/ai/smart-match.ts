import { getTier, type TrustTier } from './trust-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface UserContext {
  trustScore: number;
  tier: TrustTier;
  walletBalance: number;
  preferredAmount?: number;   // user's ideal monthly contribution
  preferredDuration?: number; // user's ideal duration in months
}

export interface CircleCandidate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  monthly_amount: number;
  total_members: number;
  duration_months: number;
  min_trust_score: number;
  status: string;
  current_members_count: number;
  start_date: string;
  created_at: string;
  insurance_percentage: number;
  turn_allocation_method: string;
}

export interface RankedCircle extends CircleCandidate {
  matchPercentage: number;
  matchReasons: { ar: string; en: string }[];
  warnings: { ar: string; en: string }[];
}

// ---------------------------------------------------------------------------
// Tier capacity map (same as jam3iyya-service)
// ---------------------------------------------------------------------------
function getMaxAmountForTier(tier: TrustTier | null | undefined): number {
  switch (tier) {
    case 'platinum': return 2000;
    case 'gold': return 500;
    case 'silver': return 200;
    case 'bronze':
    default: return 50;
  }
}

// ---------------------------------------------------------------------------
// EDGE CASE HANDLERS
// ---------------------------------------------------------------------------

/**
 * Checks if a user is brand new with no history
 */
function isNewUser(userContext: UserContext): boolean {
  return userContext.trustScore === 0 && userContext.walletBalance === 0;
}

/**
 * Validates and sanitizes user context to prevent null/undefined issues
 */
function sanitizeUserContext(user: UserContext): UserContext {
  return {
    trustScore: Math.max(0, user.trustScore ?? 0),
    tier: user.tier ?? 'bronze',
    walletBalance: Math.max(0, user.walletBalance ?? 0),
    preferredAmount: user.preferredAmount && user.preferredAmount > 0 ? user.preferredAmount : undefined,
    preferredDuration: user.preferredDuration && user.preferredDuration > 0 ? user.preferredDuration : undefined,
  };
}

/**
 * Validates and sanitizes circle data to prevent null/undefined issues
 */
function sanitizeCircle(circle: Partial<CircleCandidate>): CircleCandidate | null {
  // Essential fields must exist
  if (!circle.id || !circle.name) {
    return null;
  }

  return {
    id: circle.id,
    name: circle.name,
    description: circle.description ?? null,
    type: circle.type ?? 'standard',
    monthly_amount: Math.max(0, circle.monthly_amount ?? 0),
    total_members: Math.max(1, circle.total_members ?? 1),
    duration_months: Math.max(1, circle.duration_months ?? 12),
    min_trust_score: Math.max(0, circle.min_trust_score ?? 0),
    status: circle.status ?? 'active',
    current_members_count: Math.max(0, Math.min(circle.current_members_count ?? 0, circle.total_members ?? 1)),
    start_date: circle.start_date ?? new Date().toISOString(),
    created_at: circle.created_at ?? new Date().toISOString(),
    insurance_percentage: Math.max(0, Math.min(circle.insurance_percentage ?? 0, 100)),
    turn_allocation_method: circle.turn_allocation_method ?? 'sequential',
  };
}

// ---------------------------------------------------------------------------
// Core ranking algorithm - ROBUST VERSION
// ---------------------------------------------------------------------------

/**
 * Main ranking function that handles all edge cases gracefully
 */
export function rankJam3iyyas(
  userContext: UserContext,
  circles: CircleCandidate[]
): RankedCircle[] {
  // EDGE CASE 1: No circles provided
  if (!circles || circles.length === 0) {
    return [];
  }

  // Sanitize input
  const user = sanitizeUserContext(userContext);

  // EDGE CASE 2: Filter out invalid circles
  const validCircles = circles
    .map(c => sanitizeCircle(c))
    .filter((c): c is CircleCandidate => c !== null);

  if (validCircles.length === 0) {
    return [];
  }

  // Score and sort
  return validCircles
    .map((circle) => scoreCircle(user, circle))
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
}

/**
 * Scores a single circle with robust null/edge case handling
 */
function scoreCircle(user: UserContext, circle: CircleCandidate): RankedCircle {
  let totalScore = 0;
  const reasons: { ar: string; en: string }[] = [];
  const warnings: { ar: string; en: string }[] = [];

  const isNewUserFlag = isNewUser(user);

  // --- 1. Trust Score Eligibility (0–30 points) ---
  if (user.trustScore >= circle.min_trust_score) {
    const surplus = user.trustScore - circle.min_trust_score;
    const eligibilityScore = Math.min(30, 15 + Math.floor(surplus / 30));
    totalScore += eligibilityScore;
    reasons.push({
      ar: 'درجة الثقة كافية للانضمام',
      en: 'Your trust score qualifies you',
    });
  } else {
    // EDGE CASE: New user might not meet minimum requirement
    if (isNewUserFlag) {
      warnings.push({
        ar: `مستخدم جديد - يتطلب حد أدنى ${circle.min_trust_score}`,
        en: `New user - Requires min ${circle.min_trust_score} score`,
      });
      // Slight penalty for new users but don't fully disqualify
      totalScore += 5;
    } else {
      warnings.push({
        ar: `يتطلب حد أدنى ${circle.min_trust_score} - درجتك ${user.trustScore}`,
        en: `Requires min ${circle.min_trust_score} score — yours is ${user.trustScore}`,
      });
    }
  }

  // --- 2. Amount Preference (0–25 points) ---
  const maxAllowed = getMaxAmountForTier(user.tier);
  if (circle.monthly_amount <= maxAllowed) {
    let amountScore = 15; // base for being within tier
    
    if (user.preferredAmount && user.preferredAmount > 0) {
      const diff = Math.abs(circle.monthly_amount - user.preferredAmount);
      // Prevent division by zero
      const closeness = Math.max(0, 1 - diff / Math.max(user.preferredAmount, 1));
      amountScore += Math.floor(closeness * 10);
      if (closeness > 0.7) {
        reasons.push({
          ar: 'المبلغ الشهري قريب من تفضيلك',
          en: 'Monthly amount matches your preference',
        });
      }
    } else {
      // EDGE CASE: New user with no preference
      amountScore += 5;
      if (isNewUserFlag) {
        reasons.push({
          ar: 'مناسب للمستخدمين الجدد',
          en: 'Suitable for new users',
        });
      }
    }
    totalScore += amountScore;
  } else {
    warnings.push({
      ar: `المبلغ أعلى من الحد المسموح لفئتك (${maxAllowed})`,
      en: `Amount exceeds your tier limit (${maxAllowed})`,
    });
  }

  // --- 3. Duration Compatibility (0–20 points) ---
  if (user.preferredDuration && user.preferredDuration > 0) {
    const durationDiff = Math.abs(circle.duration_months - user.preferredDuration);
    const durationCloseness = Math.max(0, 1 - durationDiff / Math.max(user.preferredDuration, 1));
    const durationScore = Math.floor(durationCloseness * 20);
    totalScore += durationScore;
    if (durationCloseness > 0.7) {
      reasons.push({
        ar: 'مدة الجمعية مناسبة لك',
        en: 'Circle duration fits your timeline',
      });
    }
  } else {
    // EDGE CASE: No preference or new user
    totalScore += 10;
  }

  // --- 4. Wallet Coverage (0–15 points) ---
  const requiredBalance = circle.monthly_amount * 2;
  if (user.walletBalance >= requiredBalance) {
    totalScore += 15;
    reasons.push({
      ar: 'رصيد المحفظة كافٍ',
      en: 'Wallet balance covers the deposit',
    });
  } else if (user.walletBalance >= circle.monthly_amount) {
    totalScore += 7;
    warnings.push({
      ar: 'رصيد المحفظة يغطي شهراً واحداً فقط',
      en: 'Wallet covers only 1 month — 2 recommended',
    });
  } else if (user.walletBalance > 0) {
    // EDGE CASE: Has some balance but not enough
    totalScore += 2;
    warnings.push({
      ar: 'رصيد المحفظة منخفض - قد تحتاج لتمويل الآن',
      en: 'Low wallet balance - may need funding',
    });
  } else {
    // EDGE CASE: No wallet balance
    warnings.push({
      ar: 'رصيد المحفظة غير كافٍ',
      en: 'Insufficient wallet balance',
    });
    // Don't fully disqualify - could fund later
    if (isNewUserFlag) {
      totalScore += 1; // Minimum for new users
    }
  }

  // --- 5. Availability Bonus (0–10 points) ---
  const slotsLeft = Math.max(0, circle.total_members - circle.current_members_count);
  
  // EDGE CASE: Circle is full or invalid member count
  if (circle.current_members_count >= circle.total_members) {
    warnings.push({
      ar: 'الجمعية ممتلئة',
      en: 'Circle is full',
    });
  } else if (slotsLeft > 0) {
    // Safe division to prevent issues
    const fillRate = circle.current_members_count / Math.max(circle.total_members, 1);
    if (fillRate >= 0.7) {
      totalScore += 10;
      reasons.push({
        ar: `${slotsLeft} مقاعد متبقية فقط — ينفد قريباً!`,
        en: `Only ${slotsLeft} spots left — filling fast!`,
      });
    } else if (fillRate >= 0.4) {
      totalScore += 5;
    } else {
      // Plenty of slots available
      totalScore += 3;
      reasons.push({
        ar: 'عدة مقاعد متاحة',
        en: 'Multiple slots available',
      });
    }
  }

  // --- FINAL: Clamp to 0-100 range ---
  const matchPercentage = Math.min(100, Math.max(0, totalScore));

  // EDGE CASE: Add advisory for new users
  if (isNewUserFlag && matchPercentage > 0) {
    if (!reasons.some(r => r.en?.includes('New'))) {
      reasons.push({
        ar: 'ستحتاج إلى التحقق من الهوية لبناء درجة ثقة',
        en: 'Identity verification needed to build trust',
      });
    }
  }

  return {
    ...circle,
    matchPercentage,
    matchReasons: reasons,
    warnings,
  };
}
