import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';
import { getMyJam3iyyas } from '@/lib/services/jam3iyya-service';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data, error } = await getMyJam3iyyas(session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const circleIds = (data ?? []).map((membership) => membership.jam3iyya_id);
    const { data: memberRows, error: membersError } = await supabase
      .from('jam3iyya_members')
      .select('jam3iyya_id')
      .in('jam3iyya_id', circleIds.length > 0 ? circleIds : ['00000000-0000-0000-0000-000000000000']);

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const currentMembersByCircle = new Map<string, number>();
    for (const row of memberRows ?? []) {
      currentMembersByCircle.set(row.jam3iyya_id, (currentMembersByCircle.get(row.jam3iyya_id) ?? 0) + 1);
    }

    const jam3iyyas = (data ?? []).map((membership) => {
      const circle = membership.jam3iyyas as Record<string, unknown>;
      return {
        ...(circle ?? {}),
        id: membership.jam3iyya_id,
        current_members_count: currentMembersByCircle.get(membership.jam3iyya_id) ?? 0,
        current_month: Number((circle?.current_month as number | string | undefined) ?? 0),
      };
    });

    return NextResponse.json({
      jam3iyyas,
      pagination: {
        limit: jam3iyyas.length,
        offset: 0,
        total: jam3iyyas.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}