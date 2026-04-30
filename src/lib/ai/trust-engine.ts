export interface InitialTrustFactors {
  hasUploadedId: boolean;
  hasUploadedSelfie: boolean;
  phoneAgeMonths: number;
  hasLinkedBank: boolean;
  hasIncomeDoc: boolean;
}

export type TrustEvent =
  | 'paid_on_time'
  | 'paid_late'
  | 'defaulted'
  | 'completed_circle'
  | 'referred_friend';

export type TrustTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Clamps the score between 0 and 1000.
 * Ensures no negative values ever leak through.
 */
function clampScore(score: number | null | undefined): number {
  const num = typeof score === 'number' ? score : 0;
  return Math.max(0, Math.min(1000, Math.floor(num)));
}

/**
 * Calculates the initial trust score based on onboarding verification factors.
 * Maximum initial score is capped at 600.
 * 
 * ROBUST: Handles null/undefined factors gracefully.
 */
export function calculateInitialScore(factors: Partial<InitialTrustFactors> | null | undefined): number {
  // EDGE CASE: Null or undefined factors
  if (!factors) {
    return 0; // New user with no verification
  }

  let score = 0;

  // Identity factors
  if (factors.hasUploadedId === true) score += 150;
  if (factors.hasUploadedSelfie === true) score += 50;

  // Device/Behavioral factor
  // Base points for having a phone, scaling up to 100 points for a 5-year old phone (60 months)
  const phoneAgeMonths = Math.max(0, factors.phoneAgeMonths ?? 0);
  const phoneAgePoints = Math.min(100, Math.floor(phoneAgeMonths * (100 / 60)));
  score += phoneAgePoints;

  // Financial factors
  if (factors.hasLinkedBank === true) score += 200;
  if (factors.hasIncomeDoc === true) score += 100;

  return clampScore(score);
}

/**
 * Updates a user's trust score based on a given event.
 * 
 * ROBUST: 
 * - Handles null/undefined current score
 * - Never produces negative values
 * - Unknown events result in no change
 */
export function updateScore(currentScore: number | null | undefined, event: TrustEvent | string): number {
  const score = clampScore(currentScore);
  let delta = 0;

  // Only apply delta for known events
  switch (event as TrustEvent) {
    case 'paid_on_time':
      delta = 20;
      break;
    case 'paid_late':
      delta = -50;
      break;
    case 'defaulted':
      delta = -100;
      break;
    case 'completed_circle':
      delta = 100;
      break;
    case 'referred_friend':
      delta = 30;
      break;
    default:
      delta = 0; // Unknown events: no change
  }

  // Apply delta but never go negative
  return clampScore(score + delta);
}

/**
 * Returns the trust tier corresponding to a given score.
 * 
 * ROBUST:
 * - Handles null/undefined scores (defaults to 'bronze')
 * - GUARANTEES no negative tier assignments
 * - Always returns valid tier
 * 
 * Tiers:
 * - Bronze: 0-399 (new users, low trust)
 * - Silver: 400-599 (some verification)
 * - Gold: 600-799 (established user)
 * - Platinum: 800-1000 (trusted member)
 */
export function getTier(score: number | null | undefined): TrustTier {
  const clamped = clampScore(score);
  
  // Explicit checks to ensure we always return a valid tier
  if (clamped < 400) return 'bronze';
  if (clamped < 600) return 'silver';
  if (clamped < 800) return 'gold';
  // All scores >= 800 are platinum
  return 'platinum';
}

/**
 * Returns localized tier label for display
 */
export function getTierLabel(tier: TrustTier | null | undefined, locale: 'ar' | 'en' = 'en'): string {
  const safeTier = tier ?? 'bronze';
  const labels = {
    bronze: { ar: 'برونز', en: 'Bronze' },
    silver: { ar: 'فضي', en: 'Silver' },
    gold: { ar: 'ذهبي', en: 'Gold' },
    platinum: { ar: 'بلاتيني', en: 'Platinum' },
  };
  return labels[safeTier]?.[locale] ?? 'Bronze';
}

export interface TrustHistoryItem {
  category?: 'identity' | 'financial' | 'behavioral';
  event?: string;
  description?: string;
  points: number;
  timestamp?: string | Date;
  [key: string]: any; // Allow for other fields from DB
}

export interface TrustScoreBreakdown {
  totalScore: number;
  tier: TrustTier;
  categories: {
    identity: number;
    financial: number;
    behavioral: number;
  };
  history: TrustHistoryItem[];
  hasHistory: boolean;
}

/**
 * Groups a user's score history into logical categories (identity, financial, behavioral).
 * 
 * ROBUST:
 * - Handles null/undefined score or history
 * - Ensures tier is always valid (never negative)
 * - Handles empty history gracefully
 * - Safe numeric operations (no NaN)
 */
export function calculateTrustScoreBreakdown(
  score: number | null | undefined, 
  history: any[] | null | undefined
): TrustScoreBreakdown {
  const totalScore = clampScore(score);
  const safeTier = getTier(totalScore);
  const historyArray = Array.isArray(history) ? history : [];

  const breakdown: TrustScoreBreakdown = {
    totalScore,
    tier: safeTier,
    categories: {
      identity: 0,
      financial: 0,
      behavioral: 0,
    },
    history: [],
    hasHistory: historyArray.length > 0,
  };

  // Process history items safely
  for (const item of historyArray) {
    // Safe point extraction
    const points = typeof item?.points === 'number' ? Math.floor(item.points) : 0;
    
    // Skip items with zero or no points
    if (points === 0) continue;

    const category = item?.category as 'identity' | 'financial' | 'behavioral' | undefined;
    
    // Determine category
    let resolvedCategory: 'identity' | 'financial' | 'behavioral' = 'behavioral';
    
    if (category && ['identity', 'financial', 'behavioral'].includes(category)) {
      resolvedCategory = category;
    } else {
      // Fallback inference based on event or description
      const desc = ((item?.description || item?.event) ?? '').toLowerCase();
      if (desc.includes('id') || desc.includes('selfie') || desc.includes('verification')) {
        resolvedCategory = 'identity';
      } else if (
        desc.includes('bank') || 
        desc.includes('income') || 
        desc.includes('paid') || 
        desc.includes('payment') ||
        desc.includes('default') || 
        desc.includes('late')
      ) {
        resolvedCategory = 'financial';
      } else if (
        desc.includes('complete') || 
        desc.includes('referr') ||
        desc.includes('participated')
      ) {
        resolvedCategory = 'behavioral';
      }
    }

    // Accumulate points safely (use clamp to prevent overflow)
    breakdown.categories[resolvedCategory] = Math.min(
      1000,
      breakdown.categories[resolvedCategory] + points
    );
    
    // Add normalized history item
    breakdown.history.push({
      ...item,
      category: resolvedCategory,
      description: item?.description || item?.event || 'Unknown trust event',
      points,
      timestamp: item?.timestamp || new Date().toISOString(),
    });
  }

  return breakdown;
}

/**
 * Validates that a profile's trust score is within acceptable range.
 * Used as a safety check when reading from database.
 * 
 * ROBUST: Ensures database values never break the system.
 */
export function validateTrustScore(score: any): number {
  return clampScore(score);
}

/**
 * Validates profile data from Supabase to prevent null issues
 */
export function sanitizeProfileTrustData(profile: any): {
  trustScore: number;
  tier: TrustTier;
  hasHistory: boolean;
} {
  // Null check for entire profile
  if (!profile) {
    return {
      trustScore: 0,
      tier: 'bronze',
      hasHistory: false,
    };
  }

  const trustScore = clampScore(profile.trust_score);
  const tier = getTier(trustScore);

  return {
    trustScore,
    tier,
    hasHistory: !!profile.trust_score_history && profile.trust_score_history.length > 0,
  };
}
