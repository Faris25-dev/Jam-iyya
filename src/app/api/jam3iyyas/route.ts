import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'jam3iyyas route placeholder' }, { status: 501 });
}