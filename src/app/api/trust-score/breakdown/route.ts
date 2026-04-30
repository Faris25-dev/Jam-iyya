import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateTrustScoreBreakdown } from '@/lib/ai/trust-engine';

export async function GET() {
  try {
    const supabase = await createServerClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trust_score, tier, has_uploaded_id, has_uploaded_selfie, has_linked_bank, has_income_doc, phone_age_months')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. Fetch history
    const { data: rawHistory, error: histError } = await supabase
      .from('trust_score_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (histError) {
      console.error('Error fetching trust history for breakdown:', histError);
    }

    // 4. Transform history rows into the format the engine expects
    const historyItems = (rawHistory ?? []).map((row: any) => ({
      id: row.id,
      points: row.score_change ?? 0,
      description: row.reason ?? 'Unknown event',
      category: row.metadata?.category ?? undefined,
      event: row.reason ?? '',
      timestamp: row.created_at,
      new_total_score: row.new_total_score,
    }));

    // 5. Calculate breakdown using the trust engine
    const breakdown = calculateTrustScoreBreakdown(profile.trust_score ?? 0, historyItems);

    // 6. Also build per-factor status for the UI checklist
    const factorStatus = {
      hasUploadedId: !!profile.has_uploaded_id,
      hasUploadedSelfie: !!profile.has_uploaded_selfie,
      hasLinkedBank: !!profile.has_linked_bank,
      hasIncomeDoc: !!profile.has_income_doc,
      phoneAgeMonths: profile.phone_age_months ?? 0,
    };

    return NextResponse.json({
      score: profile.trust_score ?? 0,
      tier: profile.tier ?? 'bronze',
      breakdown: breakdown.categories,
      factors: factorStatus,
      history: breakdown.history,
    });
  } catch (error) {
    console.error('Trust score breakdown error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
