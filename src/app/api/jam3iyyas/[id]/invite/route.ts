import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) throw new Error('Service role key not configured');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const uuidSchema = z.string().uuid();
const bodySchema = z.object({ user_id: z.string().uuid() }).strict();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!uuidSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  const { user_id: invitedUserId } = parsed.data;
  const admin = getAdminClient();

  // Fetch circle + current members
  const { data: circle, error: circleError } = await admin
    .from('jam3iyyas')
    .select('id, creator_id, status, total_members, turn_allocation_method, jam3iyya_members(id, user_id)')
    .eq('id', params.id)
    .single();

  if (circleError || !circle) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
  }

  if (circle.creator_id !== session.user.id) {
    return NextResponse.json({ error: 'Only the creator can invite members' }, { status: 403 });
  }

  if (circle.status !== 'recruiting') {
    return NextResponse.json({ error: 'Circle is no longer recruiting' }, { status: 409 });
  }

  const members = (circle.jam3iyya_members as { id: string; user_id: string }[]) ?? [];

  if (members.some((m) => m.user_id === invitedUserId)) {
    return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
  }

  if (members.length >= circle.total_members) {
    return NextResponse.json({ error: 'Circle is full' }, { status: 409 });
  }

  // Assign turn for first_come allocation immediately
  let assignedTurn: number | null = null;
  if (circle.turn_allocation_method === 'first_come') {
    assignedTurn = members.length + 1;
  }

  // Insert member
  const { data: membership, error: insertError } = await admin
    .from('jam3iyya_members')
    .insert({
      jam3iyya_id: params.id,
      user_id: invitedUserId,
      turn_number: assignedTurn,
      status: 'active',
      total_paid: 0,
      has_received: false,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to add member', details: insertError.message }, { status: 500 });
  }

  // Check if circle is now full → auto-activate + assign turns
  const newCount = members.length + 1;
  if (newCount >= circle.total_members) {
    await admin.from('jam3iyyas').update({ status: 'active' }).eq('id', params.id);

    if (circle.turn_allocation_method === 'lottery') {
      const { data: allMembers } = await admin
        .from('jam3iyya_members')
        .select('id')
        .eq('jam3iyya_id', params.id);

      if (allMembers) {
        const shuffled = [...allMembers].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length; i++) {
          await admin
            .from('jam3iyya_members')
            .update({ turn_number: i + 1 })
            .eq('id', shuffled[i].id);
        }
      }
    }
  }

  // Notify the invited user
  try {
    await admin.from('notifications').insert({
      user_id: invitedUserId,
      title: 'دعوة للانضمام لجمعية',
      message: 'تمت إضافتك كعضو في جمعية جديدة',
      type: 'invite',
    });
  } catch {
    // Notification delivery should not block membership creation.
  }

  return NextResponse.json({ membership, circle_activated: newCount >= circle.total_members }, { status: 201 });
}
