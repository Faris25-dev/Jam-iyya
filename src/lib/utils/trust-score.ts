export interface TrustScoreInputs {
  onTimePayments: number;
  missedPayments: number;
  completedJam3iyyas: number;
  activeJam3iyyas: number;
  verificationBonus?: number;
}

export function calculateTrustScore(inputs: TrustScoreInputs) {
  const baseScore = 500;
  const paymentBonus = inputs.onTimePayments * 15 - inputs.missedPayments * 40;
  const participationBonus = inputs.completedJam3iyyas * 35 - inputs.activeJam3iyyas * 10;
  const verificationBonus = inputs.verificationBonus ?? 0;

  return Math.max(0, Math.min(1000, Math.round(baseScore + paymentBonus + participationBonus + verificationBonus)));
}

export function getTrustTier(score: number) {
  if (score >= 800) return 'platinum';
  if (score >= 650) return 'gold';
  if (score >= 450) return 'silver';
  return 'bronze';
}