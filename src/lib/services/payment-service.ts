import { addMonths, formatISO, parseISO } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

type Jam3iyyaRow = Database['public']['Tables']['jam3iyyas']['Row'];
type Jam3iyyaMemberRow = Database['public']['Tables']['jam3iyya_members']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface CycleResult {
  success: boolean;
  jam3iyya_id: string;
  month: number;
  pot_amount: number;
  turn_holder: { id: string; name: string };
  paid_members_count: number;
  late_members_count: number;
  insurance_used: number;
  insurance_pool_after: number;
  is_circle_completed: boolean;
  errors: string[];
}

export interface PaymentResult {
  success: boolean;
  jam3iyya_id: string;
  user_id: string;
  month: number;
  status: 'paid' | 'late' | 'defaulted' | 'covered_by_insurance';
  amount: number;
  insurance_contribution: number;
  wallet_balance_after?: number;
  insurance_pool_after?: number;
  errors?: string[];
}

export interface DefaultResult {
  success: boolean;
  jam3iyya_id: string;
  user_id: string;
  month: number;
  covered: boolean;
  insurance_remaining: number;
  errors?: string[];
}

export interface PaymentSchedule {
  jam3iyya_id: string;
  total_months: number;
  current_month: number;
  schedule: Array<{
    month: number;
    due_date: string;
    turn_holder: { id: string; name: string; turn_number: number | null };
    members: Array<{
      member_id: string;
      name: string;
      payment_status: 'pending' | 'paid' | 'late' | 'defaulted' | 'covered_by_insurance';
      amount: number;
      paid_date: string | null;
    }>;
    total_collected: number;
    pot_distributed: number;
    insurance_added_this_month: number;
  }>;
}

type RpcEnvelope<T> = T extends object ? T : Record<string, unknown>;

let adminClient: any = null;

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function toMoney(value: unknown) {
  const numericValue = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  return roundMoney(Number.isFinite(numericValue) ? numericValue : 0);
}

function getAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role client is not configured');
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

async function getCircleWithMembers(jam3iyyaId: string) {
  const supabase: any = getAdminClient();

  const { data, error } = await supabase
    .from('jam3iyyas')
    .select(
      `
        *,
        jam3iyya_members (
          *,
          profiles (
            full_name,
            wallet_balance,
            trust_score,
            tier,
            verification_status
          )
        )
      `,
    )
    .eq('id', jam3iyyaId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Circle not found');
  }

  return data as Jam3iyyaRow & {
    jam3iyya_members: Array<
      Jam3iyyaMemberRow & {
        profiles: Pick<
          ProfileRow,
          'full_name' | 'wallet_balance' | 'trust_score' | 'tier' | 'verification_status'
        >;
      }
    >;
  };
}

function chooseTurnHolder(
  members: Array<
    Jam3iyyaMemberRow & {
      profiles: Pick<
        ProfileRow,
        'full_name' | 'wallet_balance' | 'trust_score' | 'tier' | 'verification_status'
      >;
    }
  >,
  currentMonth: number,
) {
  const activeMembers = members.filter((member) => member.status === 'active');
  const exactMatch = activeMembers.find((member) => member.turn_number === currentMonth);

  if (exactMatch) {
    return exactMatch;
  }

  const orderedMembers = [...activeMembers].sort((left, right) => {
    const leftTurn = left.turn_number ?? Number.MAX_SAFE_INTEGER;
    const rightTurn = right.turn_number ?? Number.MAX_SAFE_INTEGER;
    return leftTurn - rightTurn;
  });

  const nextMember = orderedMembers.find((member) => (member.turn_number ?? 0) > currentMonth);
  return nextMember ?? orderedMembers[0] ?? null;
}

export async function updateTrustScore(userId: string, change: number, reason: string): Promise<void> {
  const supabase: any = getAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('trust_score')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? 'Profile not found');
  }

  const currentScore = toMoney(profile.trust_score);
  const newScore = Math.max(0, Math.min(1000, Math.round(currentScore + change)));
  const tier = newScore >= 800 ? 'platinum' : newScore >= 650 ? 'gold' : newScore >= 450 ? 'silver' : 'bronze';

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ trust_score: newScore, tier })
    .eq('id', userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: historyError } = await supabase.from('trust_score_history').insert({
    user_id: userId,
    score_change: change,
    reason,
    new_total_score: newScore,
    metadata: { source: 'payment-service' },
  });

  if (historyError) {
    throw new Error(historyError.message);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
): Promise<void> {
  const supabase: any = getAdminClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function processMonthlyPaymentCycle(jam3iyyaId: string): Promise<CycleResult> {
  try {
    const supabase: any = getAdminClient();
    const { data, error } = await supabase.rpc('process_monthly_cycle', {
      p_jam3iyya_id: jam3iyyaId,
    });

    if (error) {
      console.error('processMonthlyPaymentCycle rpc error', { jam3iyyaId, error });
      return {
        success: false,
        jam3iyya_id: jam3iyyaId,
        month: 0,
        pot_amount: 0,
        turn_holder: { id: '', name: '' },
        paid_members_count: 0,
        late_members_count: 0,
        insurance_used: 0,
        insurance_pool_after: 0,
        is_circle_completed: false,
        errors: [error.message],
      };
    }

    const result = (data ?? {}) as RpcEnvelope<CycleResult>;
    console.log('processMonthlyPaymentCycle result', result);
    return {
      success: Boolean(result.success),
      jam3iyya_id: String(result.jam3iyya_id ?? jam3iyyaId),
      month: Number(result.month ?? 0),
      pot_amount: toMoney(result.pot_amount),
      turn_holder: {
        id: String((result.turn_holder as { id?: string } | undefined)?.id ?? ''),
        name: String((result.turn_holder as { name?: string } | undefined)?.name ?? ''),
      },
      paid_members_count: Number(result.paid_members_count ?? 0),
      late_members_count: Number(result.late_members_count ?? 0),
      insurance_used: toMoney(result.insurance_used),
      insurance_pool_after: toMoney(result.insurance_pool_after),
      is_circle_completed: Boolean(result.is_circle_completed),
      errors: Array.isArray(result.errors) ? result.errors.map(String) : [],
    };
  } catch (error) {
    console.error('processMonthlyPaymentCycle failed', { jam3iyyaId, error });
    return {
      success: false,
      jam3iyya_id: jam3iyyaId,
      month: 0,
      pot_amount: 0,
      turn_holder: { id: '', name: '' },
      paid_members_count: 0,
      late_members_count: 0,
      insurance_used: 0,
      insurance_pool_after: 0,
      is_circle_completed: false,
      errors: [error instanceof Error ? error.message : 'Unexpected error'],
    };
  }
}

export async function processManualPayment(
  userId: string,
  jam3iyyaId: string,
  monthNumber: number,
): Promise<PaymentResult> {
  try {
    const supabase: any = getAdminClient();
    const { data, error } = await supabase.rpc('process_manual_payment', {
      p_user_id: userId,
      p_jam3iyya_id: jam3iyyaId,
      p_month_number: monthNumber,
    });

    if (error) {
      console.error('processManualPayment rpc error', { userId, jam3iyyaId, monthNumber, error });
      return {
        success: false,
        jam3iyya_id: jam3iyyaId,
        user_id: userId,
        month: monthNumber,
        status: 'late',
        amount: 0,
        insurance_contribution: 0,
        errors: [error.message],
      };
    }

    const result = (data ?? {}) as RpcEnvelope<PaymentResult>;
    console.log('processManualPayment result', result);
    return {
      success: Boolean(result.success),
      jam3iyya_id: String(result.jam3iyya_id ?? jam3iyyaId),
      user_id: String(result.user_id ?? userId),
      month: Number(result.month ?? monthNumber),
      status: (result.status as PaymentResult['status']) ?? 'paid',
      amount: toMoney(result.amount),
      insurance_contribution: toMoney(result.insurance_contribution),
      wallet_balance_after: result.wallet_balance_after === undefined ? undefined : toMoney(result.wallet_balance_after),
      insurance_pool_after: result.insurance_pool_after === undefined ? undefined : toMoney(result.insurance_pool_after),
      errors: Array.isArray(result.errors) ? result.errors.map(String) : undefined,
    };
  } catch (error) {
    console.error('processManualPayment failed', { userId, jam3iyyaId, monthNumber, error });
    return {
      success: false,
      jam3iyya_id: jam3iyyaId,
      user_id: userId,
      month: monthNumber,
      status: 'late',
      amount: 0,
      insurance_contribution: 0,
      errors: [error instanceof Error ? error.message : 'Unexpected error'],
    };
  }
}

export async function handleDefault(
  userId: string,
  jam3iyyaId: string,
  monthNumber: number,
): Promise<DefaultResult> {
  try {
    const supabase: any = getAdminClient();
    const { data, error } = await supabase.rpc('handle_default_payment', {
      p_user_id: userId,
      p_jam3iyya_id: jam3iyyaId,
      p_month_number: monthNumber,
    });

    if (error) {
      console.error('handleDefault rpc error', { userId, jam3iyyaId, monthNumber, error });
      return {
        success: false,
        jam3iyya_id: jam3iyyaId,
        user_id: userId,
        month: monthNumber,
        covered: false,
        insurance_remaining: 0,
        errors: [error.message],
      };
    }

    const result = (data ?? {}) as RpcEnvelope<DefaultResult>;
    console.log('handleDefault result', result);
    return {
      success: Boolean(result.success),
      jam3iyya_id: String(result.jam3iyya_id ?? jam3iyyaId),
      user_id: String(result.user_id ?? userId),
      month: Number(result.month ?? monthNumber),
      covered: Boolean(result.covered),
      insurance_remaining: toMoney(result.insurance_remaining),
      errors: Array.isArray(result.errors) ? result.errors.map(String) : undefined,
    };
  } catch (error) {
    console.error('handleDefault failed', { userId, jam3iyyaId, monthNumber, error });
    return {
      success: false,
      jam3iyya_id: jam3iyyaId,
      user_id: userId,
      month: monthNumber,
      covered: false,
      insurance_remaining: 0,
      errors: [error instanceof Error ? error.message : 'Unexpected error'],
    };
  }
}

export async function getPaymentSchedule(jam3iyyaId: string): Promise<PaymentSchedule> {
  const supabase: any = getAdminClient();

  const { data: circle, error: circleError } = await supabase
    .from('jam3iyyas')
    .select('id, total_members, duration_months, start_date, current_month, monthly_amount, insurance_percentage, jam3iyya_members(*, profiles(full_name))')
    .eq('id', jam3iyyaId)
    .single();

  if (circleError || !circle) {
    throw new Error(circleError?.message ?? 'Circle not found');
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('jam3iyya_id', jam3iyyaId)
    .order('month_number', { ascending: true });

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }

  const members = (circle.jam3iyya_members ?? []) as Array<
    Jam3iyyaMemberRow & {
      profiles?: Pick<ProfileRow, 'full_name'>;
    }
  >;

  const paymentsByMonth = new Map<number, PaymentRow[]>();
  for (const payment of payments ?? []) {
    const monthPayments = paymentsByMonth.get(payment.month_number) ?? [];
    monthPayments.push(payment);
    paymentsByMonth.set(payment.month_number, monthPayments);
  }

  const schedule = Array.from({ length: Number(circle.duration_months ?? 0) }, (_, index) => {
    const month = index + 1;
    const turnHolder = chooseTurnHolder(
      members as Array<
        Jam3iyyaMemberRow & {
          profiles: Pick<
            ProfileRow,
            'full_name' | 'wallet_balance' | 'trust_score' | 'tier' | 'verification_status'
          >;
        }
      >,
      month,
    );
    const monthPayments = paymentsByMonth.get(month) ?? [];
    const monthStart = parseISO(circle.start_date);
    const dueDate = formatISO(addMonths(monthStart, index), { representation: 'date' });

    const memberRows = members.map((member) => {
      const memberPayment = monthPayments.find((payment) => payment.user_id === member.user_id);
      const profileName = member.profiles?.full_name ?? 'Unknown member';

      return {
        member_id: member.user_id,
        name: profileName,
        payment_status: (memberPayment?.status ?? 'pending') as PaymentSchedule['schedule'][number]['members'][number]['payment_status'],
        amount: toMoney(memberPayment?.amount ?? circle.monthly_amount),
        paid_date: memberPayment?.paid_date ?? null,
      };
    });

    const totalCollected = roundMoney(
      monthPayments.reduce((sum, payment) => {
        if (payment.status === 'paid' || payment.status === 'covered_by_insurance') {
          return sum + toMoney(payment.amount);
        }

        return sum;
      }, 0),
    );

    const insuranceAddedThisMonth = roundMoney(
      monthPayments.reduce((sum, payment) => {
        if (payment.status === 'paid' || payment.status === 'covered_by_insurance') {
          const insuranceContribution = roundMoney(
            (toMoney(payment.amount) * toMoney(circle.insurance_percentage)) / 100,
          );
          return sum + insuranceContribution;
        }

        return sum;
      }, 0),
    );

    return {
      month,
      due_date: dueDate,
      turn_holder: {
        id: turnHolder?.user_id ?? '',
        name: turnHolder?.profiles?.full_name ?? 'Unassigned',
        turn_number: turnHolder?.turn_number ?? null,
      },
      members: memberRows,
      total_collected: totalCollected,
      pot_distributed: roundMoney(totalCollected - insuranceAddedThisMonth),
      insurance_added_this_month: insuranceAddedThisMonth,
    };
  });

  return {
    jam3iyya_id: jam3iyyaId,
    total_months: Number(circle.duration_months ?? 0),
    current_month: Number(circle.current_month ?? 0),
    schedule,
  };
}
