import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body as { phone?: string };

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Send OTP via Supabase Auth (which is configured to use Twilio)
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      console.error('Supabase signInWithOtp error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'OTP sent successfully', data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
