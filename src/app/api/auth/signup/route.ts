import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body as {
      email?: string
      password?: string
      name?: string
      phone?: string
    }

    // Validate required fields
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: 'Email, password, name, and phone are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Basic password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Create user with email/password
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone,
        },
      },
    })

    if (signupError) {
      return NextResponse.json(
        { success: false, error: signupError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Send OTP to phone for verification
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
    })

    if (otpError) {
      // Note: OTP send failure doesn't block signup - user still created
      console.warn('OTP send failed:', otpError.message)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created. Please verify your phone number.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          phone: phone,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 400 }
    )
  }
}
