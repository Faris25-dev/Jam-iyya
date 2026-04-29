import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = body as { phone?: string }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'OTP sent' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 400 }
    )
  }
}
