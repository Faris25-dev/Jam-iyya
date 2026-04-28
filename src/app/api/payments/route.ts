import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'payments route placeholder' }, { status: 501 });
}