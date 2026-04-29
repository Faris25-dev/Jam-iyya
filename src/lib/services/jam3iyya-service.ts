import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

// ---------------------------------------------------------------------------
// Row type aliases (directly from the Database schema)
// ---------------------------------------------------------------------------
type Jam3iyyaRow = Database['public']['Tables']['jam3iyyas']['Row'];
type Jam3iyyaInsert = Database['public']['Tables']['jam3iyyas']['Insert'];
type Jam3iyyaMemberRow = Database['public']['Tables']['jam3iyya_members']['Row'];
type Jam3iyyaMemberInsert = Database['public']['Tables']['jam3iyya_members']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// Input / filter types
// ---------------------------------------------------------------------------
export interface CreateJam3iyyaInput {
  name: string;
  description?: string;
  type: 'private' | 'semi_public' | 'public';
  monthly_amount: number;
  total_members: number;
  duration_months: number;
  start_date: string; // ISO date
  min_trust_score?: number;
  turn_allocation_method?: 'lottery' | 'auction' | 'first_come' | 'manual';
  creator_id: string;
}

export interface ListFilters {
  status?: 'recruiting' | 'active' | 'completed' | 'cancelled';
  type?: 'public' | 'semi_public' | 'private';
  min_amount?: number;
  max_amount?: number;
  min_duration?: number;
  max_duration?: number;
  user_min_trust_score?: number;
  limit?: number;
  offset?: number;
}

export interface UpdateJam3iyyaInput {
  name?: string;
  description?: string;
  min_trust_score?: number;
  start_date?: string;
  turn_allocation_method?: 'lottery' | 'auction' | 'first_come' | 'manual';
}

export interface JoinError {
  code: string;
  message: { ar: string; en: string };
  details?: any;
}

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------
export interface MemberWithProfile extends Jam3iyyaMemberRow {
  profiles: Pick<
    ProfileRow,
    'full_name' | 'trust_score' | 'tier' | 'profile_image_url' | 'verification_status'
  >;
}

export interface Jam3iyyaWithMembers extends Jam3iyyaRow {
  members: MemberWithProfile[];
}

export interface Jam3iyyaWithCount extends Jam3iyyaRow {
  current_members_count: number;
}

export interface MyJam3iyya {
  /** Membership record */
  id: string;
  jam3iyya_id: string;
  user_id: string;
  turn_number: number | null;
  has_received: boolean;
  total_paid: number;
  joined_at: string;
  status: Jam3iyyaMemberRow['status'];
  /** The parent circle */
  jam3iyyas: Jam3iyyaRow;
}

type ServiceResult<T> = { data: T; error: null } | { data: null; error: Error };

// ---------------------------------------------------------------------------
// 1. createJam3iyya
// ---------------------------------------------------------------------------
export async function createJam3iyya(
  input: CreateJam3iyyaInput,
  supabaseClient?: ReturnType<typeof createSupabaseServerClient> | any
): Promise<ServiceResult<Jam3iyyaRow>> {
  // ---- Validation ----
  if (input.total_members < 3 || input.total_members > 20) {
    return {
      data: null,
      error: new Error('total_members must be between 3 and 20'),
    };
  }
  if (input.monthly_amount <= 0) {
    return {
      data: null,
      error: new Error('monthly_amount must be greater than 0'),
    };
  }
  if (input.duration_months !== input.total_members) {
    return {
      data: null,
      error: new Error(
        'duration_months must equal total_members (every member gets exactly one turn)',
      ),
    };
  }

  const supabase = supabaseClient ?? createSupabaseServerClient();

  const insertPayload: Jam3iyyaInsert = {
    name: input.name,
    description: input.description ?? null,
    type: input.type,
    monthly_amount: input.monthly_amount,
    total_members: input.total_members,
    duration_months: input.duration_months,
    start_date: input.start_date,
    status: 'recruiting',
    creator_id: input.creator_id,
    min_trust_score: input.min_trust_score ?? 50,
    turn_allocation_method: input.turn_allocation_method ?? 'lottery',
  };

  const { data: circle, error: circleError } = await supabase
    .from('jam3iyyas')
    .insert(insertPayload)
    .select()
    .single();

  if (circleError || !circle) {
    return {
      data: null,
      error: new Error(circleError?.message ?? 'Failed to create jam3iyya'),
    };
  }

  // ---- Auto-enroll the creator as the first member ----
  const memberPayload: Jam3iyyaMemberInsert = {
    jam3iyya_id: circle.id,
    user_id: input.creator_id,
    turn_number: null, // assigned later via lottery / allocation
    status: 'active',
    total_paid: 0,
    has_received: false,
  };

  const { error: memberError } = await supabase
    .from('jam3iyya_members')
    .insert(memberPayload);

  if (memberError) {
    // Roll back the circle since the member insert failed.
    // In production a DB transaction / RPC would be preferable.
    await supabase.from('jam3iyyas').delete().eq('id', circle.id);
    return {
      data: null,
      error: new Error(
        `Circle created but failed to add creator as member: ${memberError.message}`,
      ),
    };
  }

  return { data: circle, error: null };
}

// ---------------------------------------------------------------------------
// 2. getJam3iyya
// ---------------------------------------------------------------------------
export async function getJam3iyya(
  id: string,
): Promise<ServiceResult<Jam3iyyaWithMembers>> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jam3iyyas')
    .select(
      `
      *,
      jam3iyya_members (
        *,
        profiles (
          full_name,
          trust_score,
          tier,
          profile_image_url,
          verification_status
        )
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      // PostgREST "Row not found" code
      return { data: null, error: new Error('Jam3iyya not found') };
    }
    return {
      data: null,
      error: new Error(error?.message ?? 'Failed to fetch jam3iyya'),
    };
  }

  // Reshape: rename the nested key to `members` for a cleaner API surface
  const { jam3iyya_members, ...circle } = data as Jam3iyyaRow & {
    jam3iyya_members: MemberWithProfile[];
  };

  return {
    data: { ...circle, members: jam3iyya_members ?? [] },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 3. listJam3iyyas
// ---------------------------------------------------------------------------
export async function listJam3iyyas(
  filters: ListFilters = {},
  requestingUserId?: string,
): Promise<ServiceResult<Jam3iyyaWithCount[]>> {
  const {
    status = 'recruiting',
    type = 'public',
    min_amount,
    max_amount,
    min_duration,
    max_duration,
    user_min_trust_score,
    limit = 20,
    offset = 0,
  } = filters;

  const supabase = createSupabaseServerClient();

  // We select the circle plus an aggregated member count.
  // jam3iyya_members(count) uses the PostgREST aggregate syntax.
  let query = supabase
    .from('jam3iyyas')
    .select('*, jam3iyya_members(count)', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // ---- Type / privacy filter ----
  if (type === 'private') {
    // Only return private circles if the requesting user is a member or creator
    if (!requestingUserId) {
      return { data: [], error: null };
    }
    // For private circles we do a two-step: first get IDs the user belongs to,
    // then filter. This avoids exposing private circles to non-members.
    const { data: memberRows } = await supabase
      .from('jam3iyya_members')
      .select('jam3iyya_id')
      .eq('user_id', requestingUserId);

    const memberCircleIds = (memberRows ?? []).map((r) => r.jam3iyya_id);

    if (memberCircleIds.length === 0) {
      return { data: [], error: null };
    }

    query = query.eq('type', 'private').in('id', memberCircleIds);
  } else {
    query = query.eq('type', type);
  }

  // ---- Amount filters ----
  if (min_amount !== undefined) {
    query = query.gte('monthly_amount', min_amount);
  }
  if (max_amount !== undefined) {
    query = query.lte('monthly_amount', max_amount);
  }

  // ---- Duration filters ----
  if (min_duration !== undefined) {
    query = query.gte('duration_months', min_duration);
  }
  if (max_duration !== undefined) {
    query = query.lte('duration_months', max_duration);
  }

  // ---- Trust-score eligibility filter ----
  if (user_min_trust_score !== undefined) {
    // Only show circles whose min_trust_score requirement the user can meet
    query = query.lte('min_trust_score', user_min_trust_score);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  // Map the aggregated count into a flat field
  const mapped: Jam3iyyaWithCount[] = (data ?? []).map((row: any) => {
    const { jam3iyya_members, ...rest } = row;
    const current_members_count: number =
      jam3iyya_members?.[0]?.count ?? 0;
    return { ...rest, current_members_count };
  });

  return { data: mapped, error: null };
}

// ---------------------------------------------------------------------------
// 4. getMyJam3iyyas
// ---------------------------------------------------------------------------
export async function getMyJam3iyyas(
  userId: string,
): Promise<ServiceResult<MyJam3iyya[]>> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jam3iyya_members')
    .select(
      `
      id,
      jam3iyya_id,
      user_id,
      turn_number,
      has_received,
      total_paid,
      joined_at,
      status,
      jam3iyyas (*)
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  // Sort client-side: active circles first → recruiting → completed
  const statusOrder: Record<string, number> = {
    active: 0,
    recruiting: 1,
    completed: 2,
    cancelled: 3,
  };

  const sorted = (data ?? [])
    .map((row: any) => ({
      ...row,
      jam3iyyas: row.jam3iyyas as Jam3iyyaRow,
    }))
    .sort((a, b) => {
      const aOrder = statusOrder[a.jam3iyyas?.status ?? 'cancelled'] ?? 99;
      const bOrder = statusOrder[b.jam3iyyas?.status ?? 'cancelled'] ?? 99;
      return aOrder - bOrder;
    });

  return { data: sorted as MyJam3iyya[], error: null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function getTierFromScore(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (score >= 800) return 'platinum';
  if (score >= 600) return 'gold';
  if (score >= 400) return 'silver';
  return 'bronze';
}

export function getMaxMonthlyAmountForTier(tier: string): number {
  switch (tier) {
    case 'platinum': return 2000;
    case 'gold': return 500;
    case 'silver': return 200;
    default: return 50;
  }
}

// ---------------------------------------------------------------------------
// 5. updateJam3iyya
// ---------------------------------------------------------------------------
export async function updateJam3iyya(
  id: string,
  updates: UpdateJam3iyyaInput,
  creatorId: string
): Promise<ServiceResult<Jam3iyyaRow>> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jam3iyyas')
    .update(updates)
    .eq('id', id)
    .eq('creator_id', creatorId)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: new Error(error?.message ?? 'Update failed') };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// 6. joinJam3iyya
// ---------------------------------------------------------------------------
export async function joinJam3iyya(
  jam3iyyaId: string,
  userId: string,
  options?: { preferred_turn?: number; auction_bid?: number }
): Promise<{ data: any; error: JoinError | null }> {
  const supabase = createSupabaseServerClient();

  // 1. Fetch circle
  const { data: circle } = await supabase
    .from('jam3iyyas')
    .select('*, jam3iyya_members(user_id)')
    .eq('id', jam3iyyaId)
    .single();

  if (!circle) {
    return { data: null, error: { code: 'NOT_FOUND', message: { ar: 'الجمعية غير موجودة', en: 'Circle not found' } } };
  }

  // 2. Status check
  if (circle.status !== 'recruiting') {
    if (circle.status === 'active') return { data: null, error: { code: 'ALREADY_ACTIVE', message: { ar: 'هذه الجمعية بدأت بالفعل', en: 'This circle has already started' } } };
    if (circle.status === 'completed') return { data: null, error: { code: 'COMPLETED', message: { ar: 'هذه الجمعية اكتملت', en: 'This circle is completed' } } };
    return { data: null, error: { code: 'CANCELLED', message: { ar: 'هذه الجمعية ملغاة', en: 'This circle is cancelled' } } };
  }

  // 3. Already member check
  const members = circle.jam3iyya_members || [];
  if (members.some((m: any) => m.user_id === userId)) {
    return { data: null, error: { code: 'ALREADY_MEMBER', message: { ar: 'أنت بالفعل عضو في هذه الجمعية', en: 'You are already a member' } } };
  }

  // 4. Capacity check
  if (members.length >= circle.total_members) {
    return { data: null, error: { code: 'FULL', message: { ar: 'الجمعية ممتلئة', en: 'Circle is full' } } };
  }

  // 5. Fetch profile for tier and wallet checks
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!profile) {
    return { data: null, error: { code: 'PROFILE_NOT_FOUND', message: { ar: 'الحساب غير موجود', en: 'Profile not found' } } };
  }

  // 6. Trust score check
  if (profile.trust_score < circle.min_trust_score) {
    return { 
      data: null, 
      error: { 
        code: 'INSUFFICIENT_TRUST_SCORE', 
        message: { ar: 'درجة الثقة غير كافية', en: 'Insufficient trust score' },
        details: { current: profile.trust_score, required: circle.min_trust_score }
      } 
    };
  }

  // 7. Tier check
  const calculatedTier = getTierFromScore(profile.trust_score);
  const maxAllowed = getMaxMonthlyAmountForTier(calculatedTier);
  if (circle.monthly_amount > maxAllowed) {
    return { 
      data: null, 
      error: { 
        code: 'INSUFFICIENT_TIER', 
        message: { ar: 'فئتك لا تسمح بهذا المبلغ الشهري', en: 'Your tier does not allow this monthly amount' },
        details: { tier: calculatedTier, max_allowed: maxAllowed, required: circle.monthly_amount }
      } 
    };
  }

  // 8. Wallet sufficiency check
  const requiredBalance = circle.monthly_amount * 2;
  if (profile.wallet_balance < requiredBalance) {
    return { 
      data: null, 
      error: { 
        code: 'INSUFFICIENT_FUNDS', 
        message: { ar: 'رصيد المحفظة غير كافٍ. يجب أن يكون لديك ما يعادل شهرين.', en: 'Insufficient wallet balance. Must have 2 months coverage.' },
        details: { current: profile.wallet_balance, required: requiredBalance }
      } 
    };
  }

  // 9. Assign Turn
  let assignedTurn: number | null = null;
  if (circle.turn_allocation_method === 'first_come') {
    assignedTurn = members.length + 1;
  } else if (circle.turn_allocation_method === 'manual' && options?.preferred_turn) {
    assignedTurn = options.preferred_turn;
  }

  // 10. Insert Membership
  const { data: membership, error: insertError } = await supabase
    .from('jam3iyya_members')
    .insert({
      jam3iyya_id: jam3iyyaId,
      user_id: userId,
      turn_number: assignedTurn,
      status: 'active',
      total_paid: 0,
      has_received: false
    })
    .select()
    .single();

  if (insertError) {
    return { data: null, error: { code: 'INSERT_FAILED', message: { ar: 'فشل الانضمام', en: 'Join failed' }, details: insertError.message } };
  }

  // 11. Concurrency Check & Auto-Fill
  const { count } = await supabase
    .from('jam3iyya_members')
    .select('*', { count: 'exact', head: true })
    .eq('jam3iyya_id', jam3iyyaId)
    .eq('status', 'active');

  if (count && count > circle.total_members) {
    // Optimistic rollback
    await supabase.from('jam3iyya_members').delete().eq('id', membership.id);
    return { data: null, error: { code: 'FULL', message: { ar: 'الجمعية ممتلئة', en: 'Circle is full' } } };
  }

  let statusChanged = false;
  if (count === circle.total_members) {
    statusChanged = true;
    
    // Set circle to active
    await supabase.from('jam3iyyas').update({ status: 'active' }).eq('id', jam3iyyaId);

    if (circle.turn_allocation_method === 'lottery') {
      // Fetch all members, shuffle, and assign turns
      const { data: activeMembers } = await supabase
        .from('jam3iyya_members')
        .select('id')
        .eq('jam3iyya_id', jam3iyyaId);
      
      if (activeMembers) {
        // Shuffle array using simple Fisher-Yates
        const shuffled = [...activeMembers].sort(() => Math.random() - 0.5);
        
        // Update all members with their turn numbers sequentially
        for (let i = 0; i < shuffled.length; i++) {
          await supabase
            .from('jam3iyya_members')
            .update({ turn_number: i + 1 })
            .eq('id', shuffled[i].id);
        }
      }
    }
  }

  return { 
    data: {
      membership,
      circle_status_changed: statusChanged,
      your_turn: assignedTurn
    }, 
    error: null 
  };
}

// ---------------------------------------------------------------------------
// 7. leaveJam3iyya
// ---------------------------------------------------------------------------
export async function leaveJam3iyya(
  jam3iyyaId: string,
  userId: string
): Promise<{ data: any; error: any }> {
  const supabase = createSupabaseServerClient();

  // 1. Fetch circle and member
  const { data: circle } = await supabase
    .from('jam3iyyas')
    .select('*, jam3iyya_members(*)')
    .eq('id', jam3iyyaId)
    .single();

  if (!circle) {
    return { data: null, error: { code: 'NOT_FOUND', message: { ar: 'الجمعية غير موجودة', en: 'Circle not found' } } };
  }

  const memberRecord = circle.jam3iyya_members.find((m: any) => m.user_id === userId);
  
  if (!memberRecord) {
    return { data: null, error: { code: 'NOT_MEMBER', message: { ar: 'أنت لست عضواً في هذه الجمعية', en: 'You are not a member of this circle' } } };
  }

  // 2. Status checks
  if (circle.status === 'active') {
    return { 
      data: null, 
      error: { 
        code: 'IS_ACTIVE', 
        message: { ar: 'لا يمكنك مغادرة جمعية نشطة. هذا يعتبر تعثراً. يرجى استخدام صفحة التعثر إذا كنت غير قادر على الاستمرار في الدفع.', en: 'Cannot leave active circle. This would be a default. Use the default endpoint if you cannot continue payments.' } 
      } 
    };
  }
  if (circle.status === 'completed' || circle.status === 'cancelled') {
    return { data: null, error: { code: 'NOT_RECRUITING', message: { ar: 'الجمعية ليست نشطة لكي تغادرها', en: 'Circle is not active to leave' } } };
  }

  // 3. Creator constraints
  const otherMembers = circle.jam3iyya_members.filter((m: any) => m.user_id !== userId);
  if (circle.creator_id === userId) {
    if (otherMembers.length > 0) {
      return { 
        data: null, 
        error: { 
          code: 'CREATOR_CANNOT_LEAVE', 
          message: { ar: 'لا يمكن للمنشئ المغادرة وهناك أعضاء آخرون. قم بإلغاء الجمعية بدلاً من ذلك.', en: 'Creator cannot leave a circle with other members. Cancel the circle instead.' } 
        } 
      };
    }
  }

  // 4. Data integrity safety assertion
  if (memberRecord.total_paid > 0) {
    console.error(`[CRITICAL] Data integrity error: Member ${userId} is leaving recruiting circle ${jam3iyyaId} but has total_paid > 0!`);
    return { data: null, error: { code: 'INTEGRITY_ERROR', message: { ar: 'خطأ في نزاهة البيانات', en: 'Data integrity error: payments exist in recruiting phase.' } } };
  }

  // 5. Update member status
  const { error: updateError } = await supabase
    .from('jam3iyya_members')
    .update({ status: 'left' })
    .eq('id', memberRecord.id);

  if (updateError) {
    return { data: null, error: { code: 'DB_ERROR', message: { ar: 'فشلت المغادرة', en: 'Failed to leave circle' } } };
  }

  let circleCancelled = false;
  // 6. If creator leaving empty circle, cancel it
  if (circle.creator_id === userId && otherMembers.length === 0) {
    await supabase.from('jam3iyyas').update({ status: 'cancelled' }).eq('id', jam3iyyaId);
    circleCancelled = true;
  }

  return { 
    data: { 
      left: true, 
      circle_cancelled: circleCancelled, 
      message: { ar: 'تمت المغادرة بنجاح', en: 'Successfully left the circle' } 
    }, 
    error: null 
  };
}
