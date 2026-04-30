import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';
import { processManualPayment } from '@/lib/services/payment-service';

const manualPaymentSchema = z.object({
  jam3iyyaId: z.string().uuid(),
  monthNumber: z.number().int().min(1),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const jam3iyyaId = searchParams.get('jam3iyya_id');
    const status = searchParams.get('status');
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 20), 1), 100);
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

    let query = supabase
      .from('payments')
      .select(`
        id,
        jam3iyya_id,
        user_id,
        amount,
        month_number,
        status,
        due_date,
        paid_date,
        payment_method,
        created_at,
        jam3iyyas ( id, name, monthly_amount, duration_months, current_month )
      `, { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('month_number', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jam3iyyaId) {
      query = query.eq('jam3iyya_id', jam3iyyaId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      payments: (data ?? []).map((payment: any) => ({
        id: payment.id,
        jam3iyya_id: payment.jam3iyya_id,
        jam3iyya_name: payment.jam3iyyas?.name ?? 'Circle',
        user_id: payment.user_id,
        amount: Number(payment.amount),
        month_number: payment.month_number,
        status: payment.status,
        due_date: payment.due_date,
        paid_date: payment.paid_date,
        payment_method: payment.payment_method,
        created_at: payment.created_at,
        jam3iyya: payment.jam3iyyas ?? null,
      })),
      pagination: {
        limit,
        offset,
        total: count ?? 0,
        has_more: count ? offset + limit < count : false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = manualPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.format() }, { status: 400 });
    }

    const result = await processManualPayment(session.user.id, parsed.data.jam3iyyaId, parsed.data.monthNumber);

    if (!result.success) {
      return NextResponse.json({ error: result.errors?.[0] ?? 'Manual payment failed', details: result }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}