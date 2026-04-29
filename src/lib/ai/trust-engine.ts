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
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(1000, score));
}

/**
 * Calculates the initial trust score based on onboarding verification factors.
 * Maximum initial score is capped at 600.
 */
export function calculateInitialScore(factors: InitialTrustFactors): number {
  let score = 0;

  // Identity factors
  if (factors.hasUploadedId) score += 150;
  if (factors.hasUploadedSelfie) score += 50;

  // Device/Behavioral factor
  // Base points for having a phone, scaling up to 100 points for a 5-year old phone (60 months)
  const phoneAgePoints = Math.min(100, Math.floor(factors.phoneAgeMonths * (100 / 60)));
  score += phoneAgePoints;

  // Financial factors
  if (factors.hasLinkedBank) score += 200;
  if (factors.hasIncomeDoc) score += 100;

  return clampScore(score);
}

/**
 * Updates a user's trust score based on a given event.
 */
export function updateScore(currentScore: number, event: TrustEvent): number {
  let delta = 0;

  switch (event) {
    case 'paid_on_time':
      delta = 20;
      break;
    case 'paid_late':
      delta = -50;
      break;
    case 'defaulted':
      delta = -100; // Requirement says e.g., +20 for on-time, -100 for default
      break;
    case 'completed_circle':
      delta = 100;
      break;
    case 'referred_friend':
      delta = 30;
      break;
    default:
      delta = 0;
  }

  return clampScore(currentScore + delta);
}

/**
 * Returns the trust tier corresponding to a given score.
 */
export function getTier(score: number): TrustTier {
  const clamped = clampScore(score);
  if (clamped < 400) return 'bronze';
  if (clamped < 600) return 'silver';
  if (clamped < 800) return 'gold';
  return 'platinum';
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
  categories: {
    identity: number;
    financial: number;
    behavioral: number;
  };
  history: TrustHistoryItem[];
}

/**
 * Groups a user's score history into logical categories (identity, financial, behavioral) 
 * so the frontend can easily consume it.
 */
export function calculateTrustScoreBreakdown(score: number, history: any[]): TrustScoreBreakdown {
  const breakdown: TrustScoreBreakdown = {
    totalScore: clampScore(score),
    categories: {
      identity: 0,
      financial: 0,
      behavioral: 0,
    },
    history: [],
  };

  for (const item of history) {
    const points = typeof item.points === 'number' ? item.points : 0;
    const category = item.category as 'identity' | 'financial' | 'behavioral' | undefined;
    
    // Attempt to categorize based on known events if category isn't explicitly provided
    let resolvedCategory: 'identity' | 'financial' | 'behavioral' = 'behavioral';
    
    if (category && ['identity', 'financial', 'behavioral'].includes(category)) {
      resolvedCategory = category;
    } else {
      // Fallback inference based on event or description
      const desc = (item.description || item.event || '').toLowerCase();
      if (desc.includes('id') || desc.includes('selfie')) {
        resolvedCategory = 'identity';
      } else if (desc.includes('bank') || desc.includes('income') || desc.includes('paid') || desc.includes('default')) {
        resolvedCategory = 'financial';
      }
    }

    breakdown.categories[resolvedCategory] += points;
    
    // Push a normalized version of the item
    breakdown.history.push({
      ...item,
      category: resolvedCategory,
      description: item.description || item.event || 'Unknown trust event',
      points,
      timestamp: item.timestamp || new Date().toISOString(),
    });
  }

  return breakdown;
}
