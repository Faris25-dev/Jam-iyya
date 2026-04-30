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
function getMaxAmountForTier(tier: TrustTier): number {
  switch (tier) {
    case 'platinum': return 2000;
    case 'gold': return 500;
    case 'silver': return 200;
    default: return 50;
  }
}

// ---------------------------------------------------------------------------
// Core ranking algorithm
// ---------------------------------------------------------------------------
export function rankJam3iyyas(
  userContext: UserContext,
  circles: CircleCandidate[]
): RankedCircle[] {
  return circles
    .map((circle) => scoreCircle(userContext, circle))
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
}

function scoreCircle(user: UserContext, circle: CircleCandidate): RankedCircle {
  let totalScore = 0;
  const reasons: { ar: string; en: string }[] = [];
  const warnings: { ar: string; en: string }[] = [];

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
    warnings.push({
      ar: `يتطلب حد أدنى ${circle.min_trust_score} - درجتك ${user.trustScore}`,
      en: `Requires min ${circle.min_trust_score} score — yours is ${user.trustScore}`,
    });
  }

  // --- 2. Amount Preference (0–25 points) ---
  const maxAllowed = getMaxAmountForTier(user.tier);
  if (circle.monthly_amount <= maxAllowed) {
    let amountScore = 15; // base for being within tier
    if (user.preferredAmount && user.preferredAmount > 0) {
      const diff = Math.abs(circle.monthly_amount - user.preferredAmount);
      const closeness = Math.max(0, 1 - diff / user.preferredAmount);
      amountScore += Math.floor(closeness * 10);
      if (closeness > 0.7) {
        reasons.push({
          ar: 'المبلغ الشهري قريب من تفضيلك',
          en: 'Monthly amount matches your preference',
        });
      }
    } else {
      amountScore += 5;
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
    // No preference → neutral score
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
  } else {
    warnings.push({
      ar: 'رصيد المحفظة غير كافٍ',
      en: 'Insufficient wallet balance',
    });
  }

  // --- 5. Availability Bonus (0–10 points) ---
  const slotsLeft = circle.total_members - circle.current_members_count;
  if (slotsLeft > 0) {
    const fillRate = circle.current_members_count / circle.total_members;
    if (fillRate >= 0.7) {
      totalScore += 10;
      reasons.push({
        ar: `${slotsLeft} مقاعد متبقية فقط — ينفد قريباً!`,
        en: `Only ${slotsLeft} spots left — filling fast!`,
      });
    } else {
      totalScore += 5;
    }
  }

  // Clamp to 100
  const matchPercentage = Math.min(100, Math.max(0, totalScore));

  return {
    ...circle,
    matchPercentage,
    matchReasons: reasons,
    warnings,
  };
}
