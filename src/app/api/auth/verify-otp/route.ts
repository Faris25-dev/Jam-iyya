import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { calculateInitialScore, getTier, InitialTrustFactors } from '@/lib/ai/trust-engine'

const OTP_BYPASS = process.env.NODE_ENV !== 'production'

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

    let user
    let verifyError

    if (OTP_BYPASS) {
      // In development, get the authenticated user instead of verifying OTP
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      user = authUser
      verifyError = authError
    } else {
      // In production, verify the OTP token
      const { data: { user: verifiedUser }, error: otpError } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      })
      user = verifiedUser
      verifyError = otpError
    }

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
        // Calculate initial score using AI Trust Engine
        const factors: InitialTrustFactors = {
          hasUploadedId: false,
          hasUploadedSelfie: false,
          phoneAgeMonths: 6, // Give them 6 months baseline for verifying phone
          hasLinkedBank: false,
          hasIncomeDoc: false,
        }
        
        const initialScore = calculateInitialScore(factors);
        const initialTier = getTier(initialScore);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'User',
            phone,
            trust_score: initialScore,
            tier: initialTier,
            wallet_balance: 5000,
            verification_status: 'verified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (profileError) {
          return NextResponse.json(
            { success: false, error: profileError.message },
            { status: 400 }
          )
        }

        // Write the initial history record
        await supabase.from('trust_score_history').insert({
          user_id: user.id,
          score_change: initialScore,
          reason: 'Account creation and phone verification',
          new_total_score: initialScore,
          metadata: { factors, category: 'identity' }
        })

        return NextResponse.json(
          {
            success: true,
            user: {
              id: user.id,
              email: user.email,
              phone,
              profile,
            },
          },
          { status: 200 }
        )
      }

      // Profile already exists, just return user info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return NextResponse.json(
        {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            phone,
            profile,
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 400 }
    )
  }
}

