import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { full_name?: unknown };
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';

    if (fullName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name must be at least 2 characters' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, full_name, phone, profile_image_url, trust_score, wallet_balance, verification_status, tier, preferred_language')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
