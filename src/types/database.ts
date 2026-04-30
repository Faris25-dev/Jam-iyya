export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          national_id_hash: string | null;
          profile_image_url: string | null;
          trust_score: number;
          tier: 'bronze' | 'silver' | 'gold' | 'platinum';
          verification_status: 'unverified' | 'pending' | 'verified';
          wallet_balance: number;
          preferred_language: 'ar' | 'en';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'full_name'>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      jam3iyyas: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: 'private' | 'semi_public' | 'public';
          monthly_amount: number;
          total_members: number;
          duration_months: number;
          start_date: string;
          status: 'recruiting' | 'active' | 'completed' | 'cancelled';
          creator_id: string | null;
          min_trust_score: number;
          insurance_percentage: number;
          insurance_pool: number;
          turn_allocation_method: 'lottery' | 'auction' | 'first_come' | 'manual';
          current_month: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['jam3iyyas']['Row']> & Pick<Database['public']['Tables']['jam3iyyas']['Row'], 'name' | 'type' | 'monthly_amount' | 'total_members' | 'duration_months' | 'start_date'>;
        Update: Partial<Database['public']['Tables']['jam3iyyas']['Row']>;
      };
      jam3iyya_members: {
        Row: {
          id: string;
          jam3iyya_id: string;
          user_id: string;
          turn_number: number | null;
          joined_at: string;
          status: 'active' | 'defaulted' | 'completed' | 'left';
          total_paid: number;
          has_received: boolean;
          received_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['jam3iyya_members']['Row']> & Pick<Database['public']['Tables']['jam3iyya_members']['Row'], 'jam3iyya_id' | 'user_id'>;
        Update: Partial<Database['public']['Tables']['jam3iyya_members']['Row']>;
      };
      payments: {
        Row: {
          id: string;
          jam3iyya_id: string;
          user_id: string;
          amount: number;
          month_number: number;
          status: 'pending' | 'paid' | 'late' | 'defaulted' | 'covered_by_insurance';
          due_date: string;
          paid_date: string | null;
          payment_method: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['payments']['Row']> & Pick<Database['public']['Tables']['payments']['Row'], 'jam3iyya_id' | 'user_id' | 'amount' | 'month_number' | 'due_date'>;
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
      trust_score_history: {
        Row: {
          id: string;
          user_id: string;
          score_change: number;
          reason: string;
          new_total_score: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['trust_score_history']['Row']> & Pick<Database['public']['Tables']['trust_score_history']['Row'], 'user_id' | 'score_change' | 'reason' | 'new_total_score'>;
        Update: Partial<Database['public']['Tables']['trust_score_history']['Row']>;
      };
      transactions: {
        Row: {
          id: string;
          from_user_id: string | null;
          to_user_id: string | null;
          amount: number;
          type: 'contribution' | 'payout' | 'insurance_contribution' | 'insurance_payout' | 'deposit' | 'withdrawal';
          jam3iyya_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['transactions']['Row']> & Pick<Database['public']['Tables']['transactions']['Row'], 'amount' | 'type'>;
        Update: Partial<Database['public']['Tables']['transactions']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          related_jam3iyya_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & Pick<Database['public']['Tables']['notifications']['Row'], 'user_id' | 'title' | 'message' | 'type'>;
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
    };
  };
}