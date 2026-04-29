import { NextResponse } from 'next/server';
import { calculateInitialScore, getTier, InitialTrustFactors } from '@/lib/ai/trust-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Basic validation
    if (
      typeof body.hasUploadedId !== 'boolean' || 
      typeof body.hasUploadedSelfie !== 'boolean' || 
      typeof body.phoneAgeMonths !== 'number' || 
      typeof body.hasLinkedBank !== 'boolean' || 
      typeof body.hasIncomeDoc !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid or missing factors in request body.' }, 
        { status: 400 }
      );
    }

    const factors: InitialTrustFactors = {
      hasUploadedId: body.hasUploadedId,
      hasUploadedSelfie: body.hasUploadedSelfie,
      phoneAgeMonths: body.phoneAgeMonths,
      hasLinkedBank: body.hasLinkedBank,
      hasIncomeDoc: body.hasIncomeDoc,
    };

    const score = calculateInitialScore(factors);
    const tier = getTier(score);

    return NextResponse.json({ score, tier });
  } catch (error) {
    console.error('Error in trust-score calculate POST:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
