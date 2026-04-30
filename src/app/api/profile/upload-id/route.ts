import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

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

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ verification_status: 'pending' })
      .eq('id', userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

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
