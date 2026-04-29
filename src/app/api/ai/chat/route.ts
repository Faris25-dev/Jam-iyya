import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateChatStream, CircleContext } from '@/lib/ai/chat-assistant';

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    
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

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid or missing messages array' }, { status: 400 });
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
      // 1. Fetch the Jam3iyya details
      const { data: jam3iyya, error: jamError } = await supabase
        .from('jam3iyyas')
        .select('*')
        .eq('id', jam3iyyaId)
        .single();

      if (!jamError && jam3iyya) {
        circleContext.name = jam3iyya.name;
        circleContext.totalPot = jam3iyya.total_pot || 0;
        circleContext.monthlyContribution = jam3iyya.monthly_contribution || 0;

        // 2. Fetch the members of this Jam3iyya
        const { data: members, error: membersError } = await supabase
          .from('jam3iyya_members')
          .select(`
            user_id,
            turn_number,
            status,
            profiles ( full_name, avatar_url )
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

    // Call the Gemini chat stream utility
    const stream = await generateChatStream(messages, circleContext);

    // Return the response as a standard text stream to the client
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
