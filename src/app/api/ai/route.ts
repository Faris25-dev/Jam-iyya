import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'ai route placeholder' }, { status: 501 });
}