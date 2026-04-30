import { addMonths, differenceInCalendarDays, parseISO } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { processMonthlyPaymentCycle } from '@/lib/services/payment-service';
import type { Database } from '@/types/database';

type Jam3iyyaRow = Database['public']['Tables']['jam3iyyas']['Row'];
type Jam3iyyaWithCurrentMonth = Jam3iyyaRow & { current_month: number };

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role client is not configured');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isCronAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const testMode = request.nextUrl.searchParams.get('test') === 'true';

  if (testMode && process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (!secret) {
    return false;
  }

  return authHeader === `Bearer ${secret}`;
}

function getDueDate(circle: Pick<Jam3iyyaWithCurrentMonth, 'start_date' | 'current_month'>) {
  const baseDate = parseISO(circle.start_date);
  const monthIndex = Math.max(Number(circle.current_month ?? 1), 1) - 1;
  return addMonths(baseDate, monthIndex);
}

async function loadProcessableCircles(testMode: boolean) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('jam3iyyas')
    .select('id, name, status, start_date, current_month, duration_months, monthly_amount, total_members, insurance_percentage, insurance_pool')
    .eq('status', 'active');

  if (error) {
    throw new Error(error.message);
  }

  const today = new Date();
  const circles = (data ?? []) as Jam3iyyaWithCurrentMonth[];

  return circles
    .filter((circle) => Number(circle.current_month ?? 0) <= Number(circle.duration_months ?? 0))
    .map((circle) => {
      const dueDate = getDueDate(circle);
      return {
        ...circle,
        due_date: dueDate.toISOString(),
        due_in_days: differenceInCalendarDays(dueDate, today),
      };
    })
    .filter((circle) => (testMode ? true : circle.due_in_days <= 0));
}

export async function GET(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testMode = request.nextUrl.searchParams.get('test') === 'true' && process.env.NODE_ENV !== 'production';
    const circles = await loadProcessableCircles(testMode);

    const estimatedPotTotal = circles.reduce(
      (sum, circle) => sum + Number(circle.monthly_amount ?? 0) * Number(circle.total_members ?? 0),
      0,
    );

    return NextResponse.json({
      would_process: circles.length,
      circles: circles.map((circle) => ({
        jam3iyya_id: circle.id,
        name: circle.name,
        status: circle.status,
        month: circle.current_month,
        due_date: circle.due_date,
        days_until_due: circle.due_in_days,
        monthly_amount: Number(circle.monthly_amount ?? 0),
        estimated_pot: Number(circle.monthly_amount ?? 0) * Number(circle.total_members ?? 0),
      })),
      estimated_pot_total: estimatedPotTotal,
    });
  } catch (error) {
    console.error('Cron preview failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testMode = request.nextUrl.searchParams.get('test') === 'true' && process.env.NODE_ENV !== 'production';
    const circles = await loadProcessableCircles(testMode);

    const results = [] as Array<{
      jam3iyya_id: string;
      name: string;
      success: boolean;
      month: number;
      pot: number;
      errors: string[];
    }>;

    let successful = 0;
    let failed = 0;

    for (const circle of circles) {
      try {
        const result = await processMonthlyPaymentCycle(circle.id);
        const normalized = {
          jam3iyya_id: circle.id,
          name: circle.name,
          success: result.success,
          month: result.month,
          pot: result.pot_amount,
          errors: result.errors ?? [],
        };

        results.push(normalized);
        if (result.success) {
          successful += 1;
        } else {
          failed += 1;
        }

        console.log('Cron cycle result:', normalized);
      } catch (error) {
        failed += 1;
        const fallback = {
          jam3iyya_id: circle.id,
          name: circle.name,
          success: false,
          month: Number(circle.current_month ?? 0),
          pot: 0,
          errors: [error instanceof Error ? error.message : 'Unexpected error'],
        };

        results.push(fallback);
        console.error('Cron cycle failed:', fallback);
      }
    }

    return NextResponse.json({
      processed_at: new Date().toISOString(),
      total_circles: circles.length,
      successful,
      failed,
      results,
      errors: results.flatMap((result) => result.errors),
    });
  } catch (error) {
    console.error('Cron process failed catastrophically:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
