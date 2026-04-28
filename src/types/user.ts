export type VerificationStatus = 'unverified' | 'pending' | 'verified';
export type UserTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Profile {
  id: string;
  fullName: string;
  phone?: string | null;
  nationalIdHash?: string | null;
  profileImageUrl?: string | null;
  trustScore: number;
  tier: UserTier;
  verificationStatus: VerificationStatus;
  walletBalance: number;
  preferredLanguage: 'ar' | 'en';
  createdAt: string;
  updatedAt: string;
}