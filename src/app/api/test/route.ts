import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createJam3iyya } from '@/lib/services/jam3iyya-service';

export async function GET() {
    const supabase = await createServerClient();

    // 1. Create a NEW temporary account (now that email confirmations are off!)
    const email = `testdev${Date.now()}@jamiyya.com`;
    const password = 'TestPassword123!';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError || !authData.user) {
        return NextResponse.json(
            { error: 'Failed to sign in', details: authError?.message },
            { status: 500 }
        );
    }

    const tempUserId = authData.user.id;

    // Create an explicitly authenticated client using the token we just got!
    // This bypasses the fact that curl doesn't save/send cookies mid-request.
    const { createClient } = require('@supabase/supabase-js');
    const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${authData.session?.access_token}` } } }
    );

    // 2. Ensure this user has a profile in the public.profiles table
    const { error: profileError } = await authClient.from('profiles').upsert({
        id: tempUserId,
        full_name: 'Dev Tester',
        trust_score: 80,
        tier: 'bronze',
        verification_status: 'unverified',
        wallet_balance: 0,
        preferred_language: 'en'
    });

    if (profileError) {
        return NextResponse.json(
            { error: 'Failed to create profile', details: profileError.message },
            { status: 500 }
        );
    }

    // 3. Create the test Jam'iyya using the new temp user as creator
    const result = await createJam3iyya({
        name: 'Dev Test Circle',
        description: 'My first testing circle',
        type: 'public',
        monthly_amount: 100,
        total_members: 5,
        duration_months: 5,
        start_date: '2026-05-01',
        creator_id: tempUserId,
    }, authClient);

    return NextResponse.json({
        message: 'Success! Created a temp user and their first Jam3iyya.',
        temp_credentials_for_later: {
            email,
            password,
            user_id: tempUserId
        },
        database_result: {
            data: result.data,
            error: result.error ? result.error.message : null
        }
    });
}