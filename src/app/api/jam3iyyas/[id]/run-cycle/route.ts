import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';
import { processMonthlyPaymentCycle } from '@/lib/services/payment-service';

export const dynamic = 'force-dynamic';

const uuidSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!uuidSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
  }

  const { data: circle, error } = await supabase
    .from('jam3iyyas')
    .select('id, creator_id, status, current_month, duration_months')
    .eq('id', params.id)
    .single();

  if (error || !circle) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
  }

  if (circle.creator_id !== user.id) {
    return NextResponse.json({ error: 'Only the circle creator can trigger a cycle' }, { status: 403 });
  }

  if (circle.status !== 'active') {
    return NextResponse.json(
      { error: `Circle must be active to run a cycle (current status: ${circle.status})` },
      { status: 409 },
    );
  }

  if (Number(circle.current_month) > Number(circle.duration_months)) {
    return NextResponse.json({ error: 'All cycles have already been processed for this circle' }, { status: 409 });
  }

  const result = await processMonthlyPaymentCycle(params.id);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Cycle processing failed', details: result.errors },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
