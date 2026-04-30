import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    name: "Jam'iyya AI Assistant",
    version: '1.0.0',
    capabilities: ['circle_analysis', 'financial_planning', 'payout_projections'],
    status: 'active'
  }, { status: 200 });
}