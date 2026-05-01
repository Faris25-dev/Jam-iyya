import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, profile_image_url, trust_score, wallet_balance, verification_status, tier, preferred_language')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ success: false, error: error?.message ?? 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    });
  } catch (error) {
    console.error('Profile me failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
