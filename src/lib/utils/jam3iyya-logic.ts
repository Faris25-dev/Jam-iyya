export interface Jam3iyyaSettings {
  monthlyAmount: number;
  totalMembers: number;
  insurancePercentage: number;
}

export function calculateMonthlyInsuranceContribution(settings: Jam3iyyaSettings) {
  return Number(((settings.monthlyAmount * settings.insurancePercentage) / 100).toFixed(2));
}

export function calculateMonthlyPoolSize(settings: Jam3iyyaSettings) {
  return Number((settings.monthlyAmount * settings.totalMembers).toFixed(2));
}

export function canJoinJam3iyya({
  trustScore,
  minimumScore,
  memberCount,
  maxMembers
}: {
  trustScore: number;
  minimumScore: number;
  memberCount: number;
  maxMembers: number;
}) {
  return trustScore >= minimumScore && memberCount < maxMembers;
}