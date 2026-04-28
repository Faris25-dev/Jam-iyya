import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'trust score route placeholder' }, { status: 501 });
}