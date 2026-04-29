import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body as {
      email?: string
      password?: string
    }

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Sign in with email/password
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { success: false, error: signInError.message },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to sign in' },
        { status: 401 }
      )
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      // Profile doesn't exist yet (user hasn't completed phone verification)
      return NextResponse.json(
        {
          success: false,
          error: 'Please complete phone verification first',
          code: 'PHONE_VERIFICATION_PENDING',
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Signed in successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 400 }
    )
  }
}
