import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

type Jam3iyyaRow = Database['public']['Tables']['jam3iyyas']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];
type RpcEnvelope<T> = T extends object ? T : Record<string, unknown>;

export interface UseInsuranceResult {
  covered: boolean;
  amount_used: number;
  pool_remaining: number;
  shortfall: number;
}

export interface InsuranceHistoryItem {
  date: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
}

export interface InsuranceStatus {
  jam3iyya_id: string;
  current_pool: number;
  total_collected: number;
  total_paid_out: number;
  members_helped: number;
  defaults_covered: number;
  history: InsuranceHistoryItem[];
}

export interface OverallInsuranceStats {
  total_circles: number;
  total_pool_value: number;
  total_protected_value: number;
  total_defaults_covered: number;
  protection_ratio: number;
}

let adminClient: any = null;

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

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function toMoney(value: unknown) {
  const numericValue = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  return roundMoney(Number.isFinite(numericValue) ? numericValue : 0);
}

function assertPositiveAmount(amount: number, label: string) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
}

function normalizeHistoryReason(description: string | null, fallback: string) {
  return description?.trim() || fallback;
}

export async function addToInsurancePool(
  jam3iyyaId: string,
  amount: number,
  fromUserId: string,
): Promise<void> {
  assertPositiveAmount(amount, 'amount');
  if (!jam3iyyaId) {
    throw new Error('jam3iyyaId is required');
  }
  if (!fromUserId) {
    throw new Error('fromUserId is required');
  }

  const supabase: any = getAdminClient();
  const { data, error } = await supabase.rpc('add_to_insurance_pool', {
    p_jam3iyya_id: jam3iyyaId,
    p_amount: amount,
    p_from_user_id: fromUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = (data ?? {}) as RpcEnvelope<{ success?: boolean; error?: string }>;
  if (result.success === false) {
    throw new Error(result.error ?? 'Failed to add to insurance pool');
  }
}

export async function useInsurance(
  jam3iyyaId: string,
  requiredAmount: number,
  recipientUserId: string,
  reason: string,
): Promise<UseInsuranceResult> {
  assertPositiveAmount(requiredAmount, 'requiredAmount');
  if (!jam3iyyaId) {
    throw new Error('jam3iyyaId is required');
  }
  if (!recipientUserId) {
    throw new Error('recipientUserId is required');
  }
  if (!reason) {
    throw new Error('reason is required');
  }

  const supabase: any = getAdminClient();

  const { data, error } = await supabase.rpc('use_insurance', {
    p_jam3iyya_id: jam3iyyaId,
    p_required_amount: requiredAmount,
    p_recipient_user_id: recipientUserId,
    p_reason: reason,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = (data ?? {}) as RpcEnvelope<UseInsuranceResult>;
  return {
    covered: Boolean(result.covered),
    amount_used: toMoney(result.amount_used),
    pool_remaining: toMoney(result.pool_remaining),
    shortfall: toMoney(result.shortfall),
  };
}

export async function getInsuranceStatus(jam3iyyaId: string): Promise<InsuranceStatus> {
  if (!jam3iyyaId) {
    throw new Error('jam3iyyaId is required');
  }

  const supabase: any = getAdminClient();

  const [{ data: circle, error: circleError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      supabase
        .from('jam3iyyas')
        .select('insurance_pool')
        .eq('id', jam3iyyaId)
        .single(),
      supabase
        .from('transactions')
        .select('created_at, amount, type, description, to_user_id')
        .eq('jam3iyya_id', jam3iyyaId)
        .in('type', ['insurance_contribution', 'insurance_payout'])
        .order('created_at', { ascending: false }),
    ]);

  if (circleError || !circle) {
    throw new Error(circleError?.message ?? 'Insurance pool not found');
  }

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  const history = (transactions ?? []).map((transaction: TransactionRow) => ({
    date: transaction.created_at,
    type: transaction.type === 'insurance_contribution' ? 'in' : 'out',
    amount: toMoney(transaction.amount),
    reason: normalizeHistoryReason(transaction.description, transaction.type),
  }));

  const totalCollected = roundMoney(
    (transactions ?? [])
      .filter((transaction: TransactionRow) => transaction.type === 'insurance_contribution')
      .reduce((sum: number, transaction: TransactionRow) => sum + toMoney(transaction.amount), 0),
  );

  const totalPaidOut = roundMoney(
    (transactions ?? [])
      .filter((transaction: TransactionRow) => transaction.type === 'insurance_payout')
      .reduce((sum: number, transaction: TransactionRow) => sum + toMoney(transaction.amount), 0),
  );

  const uniqueRecipients = new Set(
    (transactions ?? [])
      .filter((transaction: TransactionRow) => transaction.type === 'insurance_payout' && transaction.to_user_id)
      .map((transaction: TransactionRow) => transaction.to_user_id as string),
  );

  return {
    jam3iyya_id: jam3iyyaId,
    current_pool: roundMoney(toMoney(circle.insurance_pool)),
    total_collected: totalCollected,
    total_paid_out: totalPaidOut,
    members_helped: uniqueRecipients.size,
    defaults_covered: (transactions ?? []).filter((transaction: TransactionRow) => transaction.type === 'insurance_payout').length,
    history,
  };
}

export async function getOverallInsuranceStats(): Promise<OverallInsuranceStats> {
  const supabase: any = getAdminClient();

  const [{ data: circles, error: circlesError }, { data: payoutRows, error: payoutError }] =
    await Promise.all([
      supabase
        .from('jam3iyyas')
        .select('id, monthly_amount, duration_months, status, insurance_pool')
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('amount, type, jam3iyya_id')
        .eq('type', 'insurance_payout'),
    ]);

  if (circlesError) {
    throw new Error(circlesError.message);
  }
  if (payoutError) {
    throw new Error(payoutError.message);
  }

  const circleRows = (circles ?? []) as Jam3iyyaRow[];
  const activeCircles = circleRows.filter((circle) => circle.status === 'active');

  const totalCircles = circleRows.length;
  const totalPoolValue = roundMoney(
    circleRows.reduce((sum: number, circle) => sum + toMoney(circle.insurance_pool), 0),
  );
  const totalProtectedValue = roundMoney(
    activeCircles.reduce(
      (sum: number, circle) => sum + toMoney(circle.monthly_amount) * Number(circle.duration_months ?? 0),
      0,
    ),
  );
  const totalDefaultsCovered = (payoutRows ?? []).length;
  const protectionRatio = totalProtectedValue > 0 ? roundMoney(totalPoolValue / totalProtectedValue) : 0;

  return {
    total_circles: totalCircles,
    total_pool_value: totalPoolValue,
    total_protected_value: totalProtectedValue,
    total_defaults_covered: totalDefaultsCovered,
    protection_ratio: protectionRatio,
  };
}
