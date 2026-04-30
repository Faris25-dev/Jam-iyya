import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) throw new Error('Service role key not configured');
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const emailSchema = z.string().email();

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();

  if (!email || !emailSchema.safeParse(email).success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const admin = getAdminClient();

  // Look up the user in auth.users by email
  const { data: authUser, error: authError } = await admin.auth.admin.getUserByEmail(email);

  if (authError || !authUser?.user) {
    return NextResponse.json({ error: 'No user found with that email' }, { status: 404 });
  }

  // Don't return yourself
  if (authUser.user.id === session.user.id) {
    return NextResponse.json({ error: 'You are already the circle creator' }, { status: 400 });
  }

  // Fetch their profile
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, full_name, trust_score, tier, verification_status, profile_image_url')
    .eq('id', authUser.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: profile.id,
    email,
    full_name: profile.full_name,
    trust_score: profile.trust_score,
    tier: profile.tier,
    verification_status: profile.verification_status,
  });
}
