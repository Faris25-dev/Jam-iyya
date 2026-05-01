import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function getSafeExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  return 'jpg';
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role client is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const avatar = formData.get('avatar');

    if (!(avatar instanceof File)) {
      return NextResponse.json({ success: false, error: 'Avatar image is required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(avatar.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported image type' }, { status: 400 });
    }

    if (avatar.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ success: false, error: 'Avatar must be 4MB or smaller' }, { status: 400 });
    }

    const admin = getAdminClient();
    const filePath = `${user.id}/avatar-${Date.now()}.${getSafeExtension(avatar)}`;
    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(filePath, avatar, {
        cacheControl: '3600',
        upsert: true,
        contentType: avatar.type,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 400 });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from('avatars').getPublicUrl(filePath);

    const { data, error: updateError } = await admin
      .from('profiles')
      .update({ profile_image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, full_name, phone, profile_image_url, trust_score, wallet_balance, verification_status, tier, preferred_language')
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, avatar_url: publicUrl, profile: data });
  } catch (error) {
    console.error('Avatar upload failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
