import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateChatStream, CircleContext } from '@/lib/ai/chat-assistant';

/**
 * Get localized error messages for friendly UI display
 */
function getLocalizedErrorMessage(errorType: string, locale: 'ar' | 'en' = 'en'): string {
  const messages: Record<string, Record<string, string>> = {
    rate_limit: {
      ar: 'تم تجاوز حد الطلبات. يرجى الانتظار بضع دقائق وحاول مرة أخرى.',
      en: 'Rate limit exceeded. Please wait a few minutes and try again.'
    },
    gemini_offline: {
      ar: 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة لاحقاً.',
      en: 'AI service is temporarily unavailable. Please try again later.'
    },
    auth_failed: {
      ar: 'فشل التحقق من الهوية. يرجى تسجيل الدخول مرة أخرى.',
      en: 'Authentication failed. Please log in again.'
    },
    db_error: {
      ar: 'خطأ في قاعدة البيانات. يرجى محاولة العملية مرة أخرى.',
      en: 'Database error. Please try again.'
    },
    invalid_request: {
      ar: 'الطلب غير صحيح. تحقق من البيانات المرسلة.',
      en: 'Invalid request. Please check your input.'
    },
    server_error: {
      ar: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
      en: 'Server error. Please try again later.'
    }
  };
  return messages[errorType]?.[locale] || messages.server_error[locale];
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();
    const locale = new URL(req.url).searchParams.get('locale') as 'ar' | 'en' || 'en';
    
    let user;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
    } else {
      const result = await supabase.auth.getUser();
      user = result.data.user;
    }

    if (!user) {
      return NextResponse.json({ 
        error: getLocalizedErrorMessage('auth_failed', locale),
        errorCode: 'AUTH_FAILED'
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jam3iyyaId = searchParams.get('jam3iyyaId');

    let query = supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (jam3iyyaId) {
      query = query.eq('jam3iyya_id', jam3iyyaId);
    }

    const { data: messages, error: dbError } = await query;

    if (dbError) {
      console.error('Chat history fetch error:', dbError);
      return NextResponse.json({ 
        error: getLocalizedErrorMessage('db_error', locale),
        errorCode: 'DB_ERROR'
      }, { status: 500 });
    }

    // Reorder ascending for chat UI
    return NextResponse.json({ messages: messages?.reverse() || [] });
  } catch (error: any) {
    console.error('Chat API GET Error:', error);
    return NextResponse.json({ 
      error: getLocalizedErrorMessage('server_error'),
      errorCode: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const locale = new URL(req.url).searchParams.get('locale') as 'ar' | 'en' || 'en';
    
    // ========== AUTHENTICATION ==========
    let user;
    let authError;

    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      authError = result.error;
    } else {
      const result = await supabase.auth.getUser();
      user = result.data.user;
      authError = result.error;
    }

    if (authError || !user) {
      return NextResponse.json({ 
        error: getLocalizedErrorMessage('auth_failed', locale),
        errorCode: 'AUTH_FAILED'
      }, { status: 401 });
    }

    // ========== REQUEST VALIDATION ==========
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ 
        error: getLocalizedErrorMessage('invalid_request', locale),
        errorCode: 'INVALID_JSON'
      }, { status: 400 });
    }

    const { messages, jam3iyyaId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        error: getLocalizedErrorMessage('invalid_request', locale),
        errorCode: 'INVALID_MESSAGES'
      }, { status: 400 });
    }

    // ========== SAVE USER MESSAGE ==========
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === 'user') {
      const { error: insertError } = await supabase.from('ai_chat_messages').insert({
        user_id: user.id,
        jam3iyya_id: jam3iyyaId || null,
        role: 'user',
        content: latestMessage.content || latestMessage.text || '',
      });

      if (insertError) {
        console.error('Failed to save user message:', insertError);
        // Non-critical: log but don't fail the entire request
      }
    }

    // ========== BUILD CIRCLE CONTEXT ==========
    const circleContext: CircleContext = {
      jam3iyyaId: jam3iyyaId || 'none',
      name: 'Unknown',
      totalPot: 0,
      monthlyContribution: 0,
      members: [],
      currentUser: { id: user.id }
    };

    // Fetch circle data if provided
    if (jam3iyyaId) {
      try {
        // 1. Verify Membership
        const { data: memberRecord } = await supabase
          .from('jam3iyya_members')
          .select('id')
          .eq('jam3iyya_id', jam3iyyaId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!memberRecord) {
          console.warn(`User ${user.id} is not a member of circle ${jam3iyyaId}`);
        } else {
          // 2. Fetch Circle Details
          const { data: jam3iyya } = await supabase
            .from('jam3iyyas')
            .select('id, name, monthly_amount, total_members')
            .eq('id', jam3iyyaId)
            .single();

          if (jam3iyya) {
            circleContext.name = jam3iyya.name || 'Unknown';
            circleContext.totalPot = (jam3iyya.monthly_amount || 0) * (jam3iyya.total_members || 0);
            circleContext.monthlyContribution = jam3iyya.monthly_amount || 0;

            // 3. Fetch Members
            const { data: members } = await supabase
              .from('jam3iyya_members')
              .select(`
                user_id,
                turn_number,
                status,
                profiles ( full_name )
              `)
              .eq('jam3iyya_id', jam3iyyaId);

            if (members && Array.isArray(members)) {
              circleContext.members = members
                .filter(m => m.user_id && (Array.isArray(m.profiles) ? m.profiles[0]?.full_name : (m.profiles as any)?.full_name))
                .map(m => ({
                  userId: m.user_id,
                  turnNumber: m.turn_number || 0,
                  status: m.status || 'active',
                  name: (Array.isArray(m.profiles) ? m.profiles[0]?.full_name : (m.profiles as any)?.full_name) || 'Unknown User'
                }));

              // Attach current user's turn info
              const currentMember = circleContext.members.find(m => m.userId === user.id);
              if (currentMember) {
                circleContext.currentUser.turnNumber = currentMember.turnNumber;
              }
            }
          }
        }
      } catch (contextError: any) {
        console.error('Error building circle context:', contextError);
        // Use default context - don't fail the chat
      }
    }

    // ========== GENERATE AI RESPONSE ==========
    let stream;
    try {
      stream = await generateChatStream(messages, circleContext);
    } catch (geminiError: any) {
      console.error('Gemini API Error:', geminiError);

      // Detect error type for user feedback
      let errorType = 'server_error';
      let statusCode = 500;

      if (geminiError.message?.includes('429') || geminiError.message?.includes('rate')) {
        errorType = 'rate_limit';
        statusCode = 429;
      } else if (geminiError.message?.includes('401') || geminiError.message?.includes('403')) {
        errorType = 'gemini_offline';
      } else if (geminiError.message?.includes('timeout')) {
        errorType = 'gemini_offline';
      }

      return NextResponse.json({ 
        error: getLocalizedErrorMessage(errorType, locale),
        errorCode: errorType.toUpperCase()
      }, { status: statusCode });
    }

    // ========== STREAM RESPONSE & SAVE TO DB ==========
    let aiResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        aiResponse += text;
        controller.enqueue(chunk);
      },
      async flush() {
        if (aiResponse.trim()) {
          try {
            await supabase.from('ai_chat_messages').insert({
              user_id: user.id,
              jam3iyya_id: jam3iyyaId || null,
              role: 'assistant',
              content: aiResponse,
            });
          } catch (saveError: any) {
            console.error('Failed to save AI response:', saveError);
            // Non-critical: response already delivered to user
          }
        }
      }
    });

    const interceptedStream = stream.pipeThrough(transformStream);

    return new Response(interceptedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: any) {
    console.error('Chat API POST Error:', error?.message || error);
    const locale = new URL(req.url).searchParams.get('locale') as 'ar' | 'en' || 'en';
    return NextResponse.json({ 
      error: getLocalizedErrorMessage('server_error', locale),
      errorCode: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
