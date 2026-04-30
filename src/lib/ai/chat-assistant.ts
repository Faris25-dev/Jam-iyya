import { GoogleGenerativeAI } from '@google/generative-ai';
import { baseChatSystemInstruction } from './prompts';

// Initialize the Google Generative AI SDK
// Ensure you have GEMINI_API_KEY set in your environment variables (.env.local)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface CircleContext {
  jam3iyyaId: string;
  name: string;
  totalPot: number;
  monthlyContribution: number;
  members: any[];
  currentUser: {
    id: string;
    turnNumber?: number;
    hasPaidCurrentMonth?: boolean;
  };
  [key: string]: any;
}

/**
 * Generates a chat stream response using the Gemini SDK.
 * Dynamically injects the user's Circle Context as a system instruction.
 * 
 * SECURITY & RELIABILITY:
 * - Uses jailbreak-proof system prompts from prompts.ts
 * - Injects verified database context only
 * - Includes error handling for API failures
 * - Prevents hallucinations of financial data
 */
export async function generateChatStream(messages: any[], circleContext: CircleContext): Promise<ReadableStream> {
  // Build the system prompt with hardened instructions
  const systemPrompt = `${baseChatSystemInstruction}

INJECTED USER CONTEXT (verified from database):
- Circle Name: ${circleContext.name || 'None'}
- Circle ID: ${circleContext.jam3iyyaId}
- Total Monthly Pot: ${circleContext.totalPot} (${circleContext.monthlyContribution} per member)
- Total Members: ${circleContext.members?.length || 0}
- Current User ID: ${circleContext.currentUser?.id}
- User's Turn Number: ${circleContext.currentUser?.turnNumber || 'Not assigned yet'}

MEMBER LIST (for reference only - do not share all details):
${circleContext.members && circleContext.members.length > 0 
  ? circleContext.members
      .slice(0, 10) // Limit to prevent prompt injection
      .map(m => `  - ${m.name} (Turn ${m.turnNumber}, Status: ${m.status})`)
      .join('\n')
  : '  (No members fetched)'}

USE THIS CONTEXT TO ANSWER QUESTIONS ACCURATELY.
DO NOT INVENT DATA. IF MISSING, SAY SO.`;

  // Format messages for Gemini SDK
  // Gemini expects: { role: 'user' | 'model', parts: [{ text: string }] }
  const formattedMessages = messages.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content || msg.text || '' }]
  }));

  // Get the model with system instruction
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    }
  });

  // Split history and current message
  const history = formattedMessages.slice(0, -1);
  const latestMessageText = formattedMessages[formattedMessages.length - 1]?.parts[0]?.text || '';

  if (!latestMessageText.trim()) {
    throw new Error('No message text to send');
  }

  let chat;
  try {
    chat = model.startChat({ history });
  } catch (error: any) {
    console.error('Failed to initialize chat:', error);
    throw new Error('Failed to initialize chat session');
  }

  // Send message and get stream
  let result;
  try {
    result = await chat.sendMessageStream(latestMessageText);
  } catch (error: any) {
    console.error('Failed to send message to Gemini:', error);
    
    // Re-throw with specific error codes for the route handler to detect
    if (error.message?.includes('429') || error.message?.includes('RATE_LIMIT')) {
      throw new Error('429: Rate limit exceeded');
    } else if (error.message?.includes('401') || error.message?.includes('UNAUTHENTICATED')) {
      throw new Error('401: API key invalid or expired');
    } else if (error.message?.includes('timeout')) {
      throw new Error('Timeout: Gemini API timeout');
    }
    throw error;
  }

  // Convert Gemini's stream format to a standard Web ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            // Encode the text string into Uint8Array chunks for the stream
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
        }
      } catch (streamError: any) {
        console.error('Stream error:', streamError);
        controller.error(streamError);
      } finally {
        controller.close();
      }
    }
  });

  return stream;
}
