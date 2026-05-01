import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { joinJam3iyya } from '@/lib/services/jam3iyya-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const uuidSchema = z.string().uuid();

const joinBodySchema = z.object({
  preferred_turn: z.number().int().min(1).optional(),
  auction_bid: z.number().positive().optional(),
}).strict();

// Map internal error codes to the requested HTTP status codes
const getErrorStatus = (code: string): number => {
  switch (code) {
    case 'NOT_FOUND':
    case 'PROFILE_NOT_FOUND':
      return 404;
    case 'INSUFFICIENT_TRUST_SCORE':
    case 'INSUFFICIENT_TIER':
    case 'INSUFFICIENT_FUNDS':
      return 403;
    case 'ALREADY_ACTIVE':
    case 'COMPLETED':
    case 'CANCELLED':
    case 'ALREADY_MEMBER':
    case 'FULL':
      return 409;
    case 'INSERT_FAILED':
      return 500;
    default:
      return 400;
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!uuidSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: 'Invalid UUID format for circle ID' }, { status: 400 });
  }

  let bodyOptions = {};
  try {
    const rawText = await request.text();
    if (rawText) {
      const rawBody = JSON.parse(rawText);
      const parsed = joinBodySchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request body', details: parsed.error.format() }, { status: 400 });
      }
      bodyOptions = parsed.data;
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { data, error } = await joinJam3iyya(params.id, user.id, bodyOptions);

  if (error) {
    return NextResponse.json(
      { error }, 
      { status: getErrorStatus(error.code) }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
