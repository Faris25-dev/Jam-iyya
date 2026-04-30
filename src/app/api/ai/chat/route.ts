import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateChatStream, CircleContext } from '@/lib/ai/chat-assistant';

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      console.error('Error fetching chat history:', dbError);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Reorder ascending for chat UI
    return NextResponse.json({ messages: messages.reverse() });
  } catch (error: any) {
    console.error('Chat API GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    
    // Securely authenticate the user
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messages, jam3iyyaId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid or missing messages array' }, { status: 400 });
    }

    // Extract latest user message to persist
    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role === 'user') {
      await supabase.from('ai_chat_messages').insert({
        user_id: user.id,
        jam3iyya_id: jam3iyyaId || null,
        role: 'user',
        content: latestMessage.content || latestMessage.text || '',
      });
    }

    // Initialize the default circle context
    const circleContext: CircleContext = {
      jam3iyyaId: jam3iyyaId || 'none',
      name: 'Unknown',
      totalPot: 0,
      monthlyContribution: 0,
      members: [],
      currentUser: { id: user.id }
    };

    // If the chat is in the context of a specific circle, fetch its data
    if (jam3iyyaId) {
      // 0. Verify Membership explicitly
      const { data: memberRecord } = await supabase
        .from('jam3iyya_members')
        .select('id')
        .eq('jam3iyya_id', jam3iyyaId)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (!memberRecord) {
         // Not a member — allow AI to answer but without exposing private circle data.
         console.warn(`User ${user.id} is not a member of circle ${jam3iyyaId}, using empty context`);
      } else {
        // 1. Fetch the Jam3iyya details
        const { data: jam3iyya, error: jamError } = await supabase
          .from('jam3iyyas')
          .select('*')
          .eq('id', jam3iyyaId)
          .single();

        if (!jamError && jam3iyya) {
          circleContext.name = jam3iyya.name;
          circleContext.totalPot = (jam3iyya.monthly_amount || 0) * (jam3iyya.total_members || 0);
          circleContext.monthlyContribution = jam3iyya.monthly_amount || 0;

          // 2. Fetch the members of this Jam3iyya
          const { data: members, error: membersError } = await supabase
            .from('jam3iyya_members')
            .select(`
              user_id,
              turn_number,
              status,
              profiles ( full_name, profile_image_url )
            `)
            .eq('jam3iyya_id', jam3iyyaId);

          if (!membersError && members) {
            circleContext.members = members.map(m => ({
              userId: m.user_id,
              turnNumber: m.turn_number,
              status: m.status,
              // @ts-ignore - Handle Supabase join typing dynamically
              name: m.profiles?.full_name || 'Unknown User'
            }));

            // Attach current user's specific state
            const currentMember = circleContext.members.find(m => m.userId === user.id);
            if (currentMember) {
              circleContext.currentUser.turnNumber = currentMember.turnNumber;
            }
          }
        } else {
          console.warn(`Could not fetch details for jam3iyyaId: ${jam3iyyaId}`);
        }
      }
    }

    // Call the Gemini chat stream utility
    const stream = await generateChatStream(messages, circleContext);

    // Stream Intercept to Save AI Response
    let aiResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        aiResponse += new TextDecoder().decode(chunk);
        controller.enqueue(chunk);
      },
      async flush() {
        if (aiResponse) {
          await supabase.from('ai_chat_messages').insert({
            user_id: user.id,
            jam3iyya_id: jam3iyyaId || null,
            role: 'assistant',
            content: aiResponse,
          });
        }
      }
    });

    const interceptedStream = stream.pipeThrough(transformStream);

    return new Response(interceptedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('Chat API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
