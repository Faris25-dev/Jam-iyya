import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getJam3iyya, updateJam3iyya } from '@/lib/services/jam3iyya-service';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

const patchBodySchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional(),
  min_trust_score: z.number().int().min(0).max(1000).optional(),
  start_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid ISO date string' })
    .refine((val) => new Date(val) > new Date(), { message: 'start_date must be in the future' })
    .optional(),
  turn_allocation_method: z.enum(['lottery', 'auction', 'first_come', 'manual']).optional(),
}).strict(); // strict will reject any fields not explicitly defined above

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 1. UUID Validation
  if (!uuidSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: 'Invalid UUID format for circle ID' }, { status: 400 });
  }

  // 2. Fetch Circle
  const { data: circle, error } = await getJam3iyya(params.id);

  if (error || !circle) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
  }

  // 3. Current User Membership Logic
  const currentUserMemberData = circle.members.find(m => m.user_id === session.user.id) || null;
  const isCurrentUserMember = !!currentUserMemberData;

  // 4. Privacy Check
  if (circle.type === 'private' && !isCurrentUserMember && circle.creator_id !== session.user.id) {
    // If it's private and you're not in it (nor the creator), we pretend it doesn't exist
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
  }

  // 5. Shape Response
  const responseData = {
    jam3iyya: {
      ...circle,
      current_members_count: circle.members.length,
      is_current_user_member: isCurrentUserMember,
      current_user_member_data: currentUserMemberData
    }
  };

  return NextResponse.json(responseData);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!uuidSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: 'Invalid UUID format for circle ID' }, { status: 400 });
  }

  // 1. Fetch current circle state to check permissions and status
  const { data: circle, error } = await getJam3iyya(params.id);

  if (error || !circle) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
  }

  // 2. Authorization Check
  if (circle.creator_id !== session.user.id) {
    return NextResponse.json({ error: 'Only the creator can update the circle' }, { status: 403 });
  }

  // 3. Status Check
  if (circle.status !== 'recruiting') {
    return NextResponse.json({ error: 'Cannot modify an active or completed circle' }, { status: 409 });
  }

  try {
    const rawBody = await request.json();

    // 4. Check for forbidden fields manually before parsing, to give the exact requested error message
    const forbiddenFields = [
      'type', 'monthly_amount', 'total_members', 'duration_months', 'creator_id', 'insurance_percentage'
    ];
    const attemptedForbidden = forbiddenFields.filter(field => field in rawBody);
    
    if (attemptedForbidden.length > 0) {
      return NextResponse.json(
        { error: `Forbidden fields cannot be updated after creation: ${attemptedForbidden.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Validate allowed fields
    const parsed = patchBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.format() }, { status: 400 });
    }

    // 6. Execute Update
    const { data: updatedCircle, error: updateError } = await updateJam3iyya(
      params.id, 
      parsed.data, 
      session.user.id
    );

    if (updateError) {
      return NextResponse.json({ error: 'Database error', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedCircle);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
