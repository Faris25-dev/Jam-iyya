export type Jam3iyyaType = 'private' | 'semi_public' | 'public';
export type Jam3iyyaStatus = 'recruiting' | 'active' | 'completed' | 'cancelled';
export type MemberStatus = 'active' | 'defaulted' | 'completed' | 'left';
export type PaymentStatus = 'pending' | 'paid' | 'late' | 'defaulted' | 'covered_by_insurance';

export interface Jam3iyya {
  id: string;
  name: string;
  description?: string | null;
  type: Jam3iyyaType;
  monthlyAmount: number;
  totalMembers: number;
  durationMonths: number;
  startDate: string;
  status: Jam3iyyaStatus;
  creatorId?: string | null;
  minTrustScore: number;
  insurancePercentage: number;
  insurancePool: number;
  turnAllocationMethod: 'lottery' | 'auction' | 'first_come' | 'manual';
}