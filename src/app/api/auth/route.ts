import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'auth route placeholder' }, { status: 501 });
}