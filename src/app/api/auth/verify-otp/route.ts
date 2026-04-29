import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, token } = body as { phone?: string; token?: string }

    if (!phone || !token) {
      return NextResponse.json(
        { error: 'Phone number and token are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    const { data: { user }, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })

    if (verifyError) {
      return NextResponse.json(
        { success: false, error: verifyError.message },
        { status: 400 }
      )
    }

    if (user) {
      // Check if profile already exists to avoid resetting data on subsequent logins
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            phone,
            trust_score: 100,
            wallet_balance: 5000,
            created_at: new Date().toISOString(),
          })

        if (profileError) {
          return NextResponse.json(
            { success: false, error: profileError.message },
            { status: 400 }
          )
        }
      }
    }

    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 400 }
    )
  }
}
