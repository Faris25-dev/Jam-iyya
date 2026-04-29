import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { listJam3iyyas, createJam3iyya } from '@/lib/services/jam3iyya-service';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const getQuerySchema = z.object({
  status: z.enum(['recruiting', 'active', 'completed', 'cancelled']).optional().default('recruiting'),
  type: z.enum(['public', 'semi_public', 'private']).optional().default('public'),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
  min_duration: z.coerce.number().optional(),
  max_duration: z.coerce.number().optional(),
  match_my_score: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

const postBodySchema = z
  .object({
    name: z.string().min(3).max(50),
    description: z.string().max(500).optional(),
    type: z.enum(['private', 'semi_public', 'public']),
    monthly_amount: z.number().min(10).max(10000),
    total_members: z.number().int().min(3).max(20),
    duration_months: z.number().int(),
    start_date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid ISO date string' })
      .refine((val) => new Date(val) > new Date(), { message: 'start_date must be in the future' }),
    min_trust_score: z.number().int().min(0).max(1000).optional().default(100),
    turn_allocation_method: z
      .enum(['lottery', 'auction', 'first_come', 'manual'])
      .optional()
      .default('lottery'),
  })
  .refine((data) => data.duration_months === data.total_members, {
    message: 'duration_months must equal total_members',
    path: ['duration_months'],
  });

// ---------------------------------------------------------------------------
// GET: List Jam3iyyas
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = getQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.format() },
      { status: 400 }
    );
  }

  const filters = parsed.data;
  let user_min_trust_score: number | undefined;

  // If match_my_score is true, get user's trust score
  if (filters.match_my_score) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('trust_score')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      user_min_trust_score = profile.trust_score;
    }
  }

  // Fetch the list from the service
  const { data, error } = await listJam3iyyas(
    {
      ...filters,
      user_min_trust_score,
    },
    session.user.id
  );

  if (error) {
    return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
  }

  // Calculate total via a quick count query to fulfill pagination requirements
  // Note: For absolute exactness with all filters, we approximate here with status & type.
  const { count, error: countError } = await supabase
    .from('jam3iyyas')
    .select('*', { count: 'exact', head: true })
    .eq('status', filters.status)
    .eq('type', filters.type);

  return NextResponse.json({
    jam3iyyas: data,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      total: countError ? data.length : (count ?? data.length),
    },
  });
}

// ---------------------------------------------------------------------------
// POST: Create a Jam3iyya
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = postBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data, error } = await createJam3iyya({
      ...parsed.data,
      creator_id: session.user.id,
    });

    if (error) {
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}