import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLockedFunds } from '@/lib/services/financial-rules-service';
import { z } from 'zod';

const walletOperationSchema = z.object({
  type: z.enum(['deposit', 'withdraw']),
  amount: z.number().positive().max(10000).multipleOf(0.01) // Max 2 decimal places
}).strict();

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: { message: { en: 'Not authenticated', ar: 'غير مسجل الدخول' } } }, 
      { status: 401 }
    );
  }

  // 1. Get Wallet Balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: { message: { en: 'Profile not found', ar: 'الحساب غير موجود' } } }, 
      { status: 404 }
    );
  }

  // 2. Get Transaction Stats
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('amount, type, from_user_id, to_user_id')
    .or(`from_user_id.eq.${session.user.id},to_user_id.eq.${session.user.id}`);

  let stats = {
    total_deposits: 0,
    total_withdrawals: 0,
    total_contributions: 0,
    total_payouts: 0,
    total_insurance_received: 0,
    net_change_30d: 0 // Simplification for MVP
  };

  if (!txError && transactions) {
    for (const tx of transactions) {
      if (tx.to_user_id === session.user.id && tx.type === 'deposit') stats.total_deposits += Number(tx.amount);
      if (tx.from_user_id === session.user.id && tx.type === 'withdrawal') stats.total_withdrawals += Number(tx.amount);
      if (tx.from_user_id === session.user.id && tx.type === 'contribution') stats.total_contributions += Number(tx.amount);
      if (tx.to_user_id === session.user.id && tx.type === 'payout') stats.total_payouts += Number(tx.amount);
      if (tx.to_user_id === session.user.id && tx.type === 'insurance_payout') stats.total_insurance_received += Number(tx.amount);
    }
    
    stats.net_change_30d = stats.total_deposits + stats.total_payouts + stats.total_insurance_received 
                         - stats.total_withdrawals - stats.total_contributions;
  }

  return NextResponse.json({
    balance: Number(profile.wallet_balance),
    stats,
    currency: "JOD"
  });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: { message: { en: 'Not authenticated', ar: 'غير مسجل الدخول' } } }, 
      { status: 401 }
    );
  }

  try {
    const rawBody = await request.json();
    const parsed = walletOperationSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: { en: 'Invalid request body', ar: 'بيانات الطلب غير صالحة' }, details: parsed.error.format() } }, 
        { status: 400 }
      );
    }

    const { type, amount } = parsed.data;

    // DEPOSIT LOGIC
    if (type === 'deposit') {
      const { data, error } = await supabase.rpc('wallet_deposit', {
        p_user_id: session.user.id,
        p_amount: amount
      });

      if (error || !data || data.length === 0) {
        return NextResponse.json(
          { error: { message: { en: 'Deposit failed', ar: 'فشل الإيداع' }, details: error } }, 
          { status: 500 }
        );
      }

      return NextResponse.json({
        balance: data[0].new_balance,
        transaction_id: data[0].transaction_id,
        type: 'deposit'
      });
    }

    // WITHDRAW LOGIC
    if (type === 'withdraw') {
      // 1. Fetch current balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', session.user.id)
        .single();

      const currentBalance = Number(profile?.wallet_balance || 0);

      // 2. Check balance sufficiency
      if (currentBalance < amount) {
        return NextResponse.json(
          { error: { message: { en: 'Insufficient balance', ar: 'رصيد غير كافٍ' } } }, 
          { status: 403 }
        );
      }

      // 3. Calculate locked funds from active circles
      const lockedFunds = await getLockedFunds(session.user.id);
      
      if ((currentBalance - amount) < lockedFunds) {
        return NextResponse.json(
          { 
            error: { 
              message: { 
                en: 'Cannot withdraw — funds reserved for active circles', 
                ar: 'لا يمكن السحب - الأموال محجوزة للجمعيات النشطة' 
              },
              details: {
                current_balance: currentBalance,
                locked_funds: lockedFunds,
                requested_amount: amount,
                available_to_withdraw: Math.max(0, currentBalance - lockedFunds)
              }
            } 
          }, 
          { status: 403 }
        );
      }

      // 4. Execute atomic withdrawal
      const { data, error } = await supabase.rpc('wallet_withdraw', {
        p_user_id: session.user.id,
        p_amount: amount
      });

      // 42350 is PostgreSQL's constraint_violation code (e.g. if the positive_balance check fails)
      if (error) {
        return NextResponse.json(
          { error: { message: { en: 'Withdrawal failed', ar: 'فشل السحب' }, details: error.message } }, 
          { status: 500 }
        );
      }

      return NextResponse.json({
        balance: data[0].new_balance,
        transaction_id: data[0].transaction_id,
        type: 'withdraw'
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: { message: { en: 'Invalid JSON body', ar: 'بيانات JSON غير صالحة' } } }, 
      { status: 400 }
    );
  }
}
