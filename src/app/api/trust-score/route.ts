import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Authenticate the user securely
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the profile
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('trust_score, tier, has_uploaded_id, has_uploaded_selfie, has_linked_bank, has_income_doc, phone_age_months')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      console.error('Error fetching profile for trust score:', dbError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in trust-score GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}