import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { leaveJam3iyya } from '@/lib/services/jam3iyya-service';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: { message: { en: 'Not authenticated', ar: 'غير مسجل الدخول' } } }, 
      { status: 401 }
    );
  }

  if (!uuidSchema.safeParse(params.id).success) {
    return NextResponse.json(
      { error: { message: { en: 'Invalid UUID format for circle ID', ar: 'معرف الجمعية غير صالح' } } }, 
      { status: 400 }
    );
  }

  const { data, error } = await leaveJam3iyya(params.id, session.user.id);

  if (error) {
    let status = 400;
    
    if (error.code === 'NOT_FOUND' || error.code === 'NOT_MEMBER') {
      status = 404;
    } else if (['IS_ACTIVE', 'NOT_RECRUITING'].includes(error.code)) {
      status = 409;
    } else if (error.code === 'CREATOR_CANNOT_LEAVE') {
      status = 403;
    } else if (error.code === 'INTEGRITY_ERROR') {
      status = 500;
    }

    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json(data, { status: 200 });
}
