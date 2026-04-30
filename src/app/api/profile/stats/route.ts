import { differenceInCalendarDays, subDays } from 'date-fns';
import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';
import { getTier } from '@/lib/ai/trust-engine';

function getNextTierMilestone(score: number) {
  if (score < 400) return 400;
  if (score < 600) return 600;
  if (score < 800) return 800;
  return null;
}

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function toMoney(value: unknown) {
  const numericValue = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  return roundMoney(Number.isFinite(numericValue) ? numericValue : 0);
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [profileResult, transactionsResult, membershipsResult, paymentsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('wallet_balance, trust_score, tier')
        .eq('id', userId)
        .single(),
      supabase
        .from('transactions')
        .select('amount, type, from_user_id, to_user_id, created_at')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
      supabase
        .from('jam3iyya_members')
        .select(`
          status,
          has_received,
          turn_number,
          jam3iyyas (
            id,
            name,
            monthly_amount,
            duration_months,
            start_date,
            status,
            current_month
          )
        `)
        .eq('user_id', userId),
      supabase
        .from('payments')
        .select(`
          jam3iyya_id,
          amount,
          due_date,
          status,
          jam3iyyas (
            name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true }),
    ]);

    const { data: profile, error: profileError } = profileResult;
    if (profileError || !profile) {
      return NextResponse.json({ error: profileError?.message ?? 'Profile not found' }, { status: 404 });
    }

    const memberships = (membershipsResult.data ?? []) as unknown as Array<{
      status: string;
      has_received: boolean;
      turn_number: number | null;
      jam3iyyas: {
        id: string;
        name: string;
        monthly_amount: number;
        duration_months: number;
        start_date: string;
        status: string;
        current_month: number;
      } | null;
    }>;

    const participatingMemberships = memberships.filter((m) => m.status === 'active' && m.jam3iyyas);
    const activeMemberships = participatingMemberships.filter((m) => m.jam3iyyas?.status === 'active');
    const completedMemberships = memberships.filter((m) => m.status === 'completed');
    const defaultedMemberships = memberships.filter((m) => m.status === 'defaulted');

    const totalContributedLifetime = roundMoney(
      (transactionsResult.data ?? [])
        .filter((transaction) => transaction.type === 'contribution' && transaction.from_user_id === userId)
        .reduce((sum, transaction) => sum + toMoney(transaction.amount), 0),
    );

    const totalReceivedLifetime = roundMoney(
      (transactionsResult.data ?? [])
        .filter((transaction) => transaction.type === 'payout' && transaction.to_user_id === userId)
        .reduce((sum, transaction) => sum + toMoney(transaction.amount), 0),
    );

    const netLifetime = roundMoney(totalReceivedLifetime - totalContributedLifetime);

    const monthlyDelta = roundMoney(
      (transactionsResult.data ?? []).reduce((sum, transaction) => {
        const transactionDate = new Date(transaction.created_at);
        if (transactionDate < subDays(new Date(), 30)) {
          return sum;
        }

        const incoming = transaction.to_user_id === userId ? toMoney(transaction.amount) : 0;
        const outgoing = transaction.from_user_id === userId ? toMoney(transaction.amount) : 0;
        return sum + incoming - outgoing;
      }, 0),
    );

    const monthlyObligation = roundMoney(
      activeMemberships.reduce((sum, membership) => sum + toMoney(membership.jam3iyyas?.monthly_amount), 0),
    );

    const nextPaymentDue = (paymentsResult.data ?? [])[0]
      ? {
          jam3iyya_id: paymentsResult.data![0].jam3iyya_id,
          jam3iyya_name: (paymentsResult.data![0].jam3iyyas as { name?: string } | null)?.name ?? 'Circle',
          amount: toMoney(paymentsResult.data![0].amount),
          due_date: paymentsResult.data![0].due_date,
          days_until_due: differenceInCalendarDays(new Date(paymentsResult.data![0].due_date), new Date()),
        }
      : null;

    const nextPayoutCandidate = activeMemberships
      .filter((membership) => membership.turn_number !== null && membership.has_received === false)
      .map((membership) => {
        const circle = membership.jam3iyyas;
        if (!circle) {
          return null;
        }
        const currentMonth = Number(circle.current_month ?? 0);
        const turnNumber = Number(membership.turn_number ?? 0);
        const monthsRemaining = Math.max(turnNumber - currentMonth, 0);

        return {
          jam3iyya_id: circle.id,
          jam3iyya_name: circle.name,
          expected_pot: roundMoney(toMoney(circle.monthly_amount) * activeMemberships.length),
          expected_date: new Date(new Date(circle.start_date).setMonth(new Date(circle.start_date).getMonth() + Math.max(turnNumber - 1, 0))).toISOString().slice(0, 10),
          months_remaining: monthsRemaining,
          turn_number: turnNumber,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => left.months_remaining - right.months_remaining)[0] ?? null;

    const nextTierAt = getNextTierMilestone(profile.trust_score ?? 0);
    const pointsToNextTier = nextTierAt === null ? 0 : Math.max(0, nextTierAt - Number(profile.trust_score ?? 0));

    return NextResponse.json({
      wallet: {
        balance: roundMoney(toMoney(profile.wallet_balance)),
        currency: 'JOD',
        monthly_delta: monthlyDelta,
      },
      trust: {
        score: Number(profile.trust_score ?? 0),
        tier: getTier(Number(profile.trust_score ?? 0)),
        next_tier_at: nextTierAt,
        points_to_next_tier: pointsToNextTier,
      },
      circles: {
        active_count: participatingMemberships.length,
        completed_count: completedMemberships.length,
        defaulted_count: defaultedMemberships.length,
        monthly_obligation: monthlyObligation,
      },
      savings: {
        total_contributed_lifetime: totalContributedLifetime,
        total_received_lifetime: totalReceivedLifetime,
        net_lifetime: netLifetime,
      },
      next_payout: nextPayoutCandidate,
      next_payment_due: nextPaymentDue,
    });
  } catch (error) {
    console.error('Profile stats GET failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
