import { NextRequest, NextResponse } from 'next/server';

import {
  getPaymentSchedule,
  handleDefault,
  processManualPayment,
  processMonthlyPaymentCycle,
} from '@/lib/services/payment-service';

type Action = 'cycle' | 'manual' | 'default' | 'schedule';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as Action | undefined;
    const jam3iyyaId = String(body.jam3iyyaId ?? '').trim();

    if (!action || !jam3iyyaId) {
      return NextResponse.json(
        { success: false, error: 'action and jam3iyyaId are required' },
        { status: 400 },
      );
    }

    if (action === 'cycle') {
      const result = await processMonthlyPaymentCycle(jam3iyyaId);
      return NextResponse.json(result);
    }

    if (action === 'schedule') {
      const result = await getPaymentSchedule(jam3iyyaId);
      return NextResponse.json({ success: true, data: result });
    }

    const userId = String(body.userId ?? '').trim();
    const monthNumber = Number(body.monthNumber);

    if (!userId || !Number.isFinite(monthNumber) || monthNumber <= 0) {
      return NextResponse.json(
        { success: false, error: 'userId and monthNumber are required for this action' },
        { status: 400 },
      );
    }

    if (action === 'manual') {
      const result = await processManualPayment(userId, jam3iyyaId, monthNumber);
      return NextResponse.json(result);
    }

    if (action === 'default') {
      const result = await handleDefault(userId, jam3iyyaId, monthNumber);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
