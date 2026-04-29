import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, token } = body as { phone?: string; token?: string };

    if (!phone || !token) {
      return NextResponse.json(
        { error: 'Phone number and token are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verify OTP using Supabase Auth
    const { data: { user, session }, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (verifyError) {
      console.error('Supabase verifyOtp error:', verifyError);
      return NextResponse.json(
        { error: verifyError.message },
        { status: verifyError.status || 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User verification failed' },
        { status: 400 }
      );
    }

    // You can also add logic here to calculate the initial Trust Score for new users
    // or update the phoneAgeMonths if necessary by calling your Trust Engine logic

    return NextResponse.json(
      { 
        success: true, 
        message: 'Phone verified successfully', 
        user: { id: user.id, phone: user.phone },
        session
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
