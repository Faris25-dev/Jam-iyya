import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateInitialScore, getTier } from '@/lib/ai/trust-engine';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const front = formData.get('front') as File | null;
    const back = formData.get('back') as File | null;
    const selfie = formData.get('selfie') as File | null;

    if (!front || !back || !selfie) {
      return NextResponse.json(
        { success: false, error: 'Missing required files (front, back, selfie)' },
        { status: 400 }
      );
    }

    const userId = user.id;
    const timestamp = Date.now();

    const uploadImage = async (file: File, type: string) => {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/${type}-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('id-documents').getPublicUrl(filePath);

      return publicUrl;
    };

    const [frontUrl, backUrl, selfieUrl] = await Promise.all([
      uploadImage(front, 'front'),
      uploadImage(back, 'back'),
      uploadImage(selfie, 'selfie'),
    ]);

    // 1. Fetch current profile to get other trust factors
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trust_score, phone_age_months, has_linked_bank, has_income_doc')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile during upload:', profileError);
    }

    // 2. Calculate new score
    const factors = {
      hasUploadedId: true,
      hasUploadedSelfie: true,
      phoneAgeMonths: profile?.phone_age_months || 6,
      hasLinkedBank: profile?.has_linked_bank || false,
      hasIncomeDoc: profile?.has_income_doc || false,
    };

    const newScore = calculateInitialScore(factors);
    const newTier = getTier(newScore);
    const scoreChange = newScore - (profile?.trust_score || 0);

    // 3. Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        verification_status: 'pending',
        has_uploaded_id: true,
        has_uploaded_selfie: true,
        trust_score: newScore,
        tier: newTier
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // 4. Log to history
    await supabase.from('trust_score_history').insert({
      user_id: userId,
      score_change: scoreChange,
      reason: 'Identity Verification Documents Uploaded',
      new_total_score: newScore,
      metadata: { factors, category: 'identity' }
    });

    return NextResponse.json(
      {
        success: true,
        urls: {
          front: frontUrl,
          back: backUrl,
          selfie: selfieUrl,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 400 }
    );
  }
}
