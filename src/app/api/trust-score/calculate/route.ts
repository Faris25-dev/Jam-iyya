import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateInitialScore, getTier, InitialTrustFactors } from '@/lib/ai/trust-engine';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    
    // Authenticate the user securely
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Calculate new score and tier
    const newScore = calculateInitialScore(factors);
    const newTier = getTier(newScore);

    // Fetch the current profile to calculate the score change
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trust_score')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const scoreChange = newScore - (profile.trust_score || 0);

    // Update the profile with new score, tier, and factors
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trust_score: newScore,
        tier: newTier,
        has_uploaded_id: factors.hasUploadedId,
        has_uploaded_selfie: factors.hasUploadedSelfie,
        phone_age_months: factors.phoneAgeMonths,
        has_linked_bank: factors.hasLinkedBank,
        has_income_doc: factors.hasIncomeDoc
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Insert history record
    const { error: historyError } = await supabase
      .from('trust_score_history')
      .insert({
        user_id: user.id,
        score_change: scoreChange,
        reason: 'Manual Score Recalculation',
        new_total_score: newScore,
        metadata: { factors, category: 'behavioral' }
      });

    if (historyError) {
      console.error('Error inserting trust score history:', historyError);
      // We don't fail the request if history fails, but we log it
    }

    return NextResponse.json({ score: newScore, tier: newTier });
  } catch (error) {
    console.error('Error in trust-score calculate POST:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
