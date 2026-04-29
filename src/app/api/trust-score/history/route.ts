import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Authenticate the user securely
    let user;
    let authError;

    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      authError = result.error;
    } else {
      const result = await supabase.auth.getUser();
      user = result.data.user;
      authError = result.error;
    }

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch history from the DB
    const { data: history, error: dbError } = await supabase
      .from('trust_score_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database error fetching trust score history:', dbError);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Unexpected error in trust-score history GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
