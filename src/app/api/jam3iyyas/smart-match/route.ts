import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { rankJam3iyyas, type UserContext, type CircleCandidate } from '@/lib/ai/smart-match';
import { getTier } from '@/lib/ai/trust-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trust_score, tier, wallet_balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. Fetch all recruiting public circles with member counts
    const { data: rawCircles, error: circleError } = await supabase
      .from('jam3iyyas')
      .select('*, jam3iyya_members(count)')
      .eq('status', 'recruiting')
      .eq('type', 'public')
      .order('created_at', { ascending: false });

    if (circleError) {
      console.error('Smart match DB error:', circleError);
      return NextResponse.json({ error: 'Failed to fetch circles' }, { status: 500 });
    }

    // 4. Transform to CircleCandidate shape
    const circles: CircleCandidate[] = (rawCircles ?? []).map((row: any) => {
      const { jam3iyya_members, ...rest } = row;
      return {
        ...rest,
        current_members_count: jam3iyya_members?.[0]?.count ?? 0,
      };
    });

    // 5. Build user context
    const userContext: UserContext = {
      trustScore: profile.trust_score ?? 0,
      tier: getTier(profile.trust_score ?? 0),
      walletBalance: profile.wallet_balance ?? 0,
    };

    // 6. Rank and return
    const ranked = rankJam3iyyas(userContext, circles);

    return NextResponse.json({
      matches: ranked,
      userContext: {
        trustScore: userContext.trustScore,
        tier: userContext.tier,
        walletBalance: userContext.walletBalance,
      },
    });
  } catch (error) {
    console.error('Smart match unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
