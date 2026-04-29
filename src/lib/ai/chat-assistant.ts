import { GoogleGenerativeAI } from '@google/generative-ai';

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
 */
export async function generateChatStream(messages: any[], circleContext: CircleContext): Promise<ReadableStream> {
  const systemPrompt = `
You are a helpful and polite financial assistant for a Jam'iyya (ROSCA - Rotating Savings and Credit Association) application.
Your goal is to answer the user's questions about their financial circles, turns, and payments.

Here is the context for the user's current circle:
- Circle Name: ${circleContext.name || 'Unknown'}
- Total Pot: ${circleContext.totalPot || 0}
- Monthly Contribution: ${circleContext.monthlyContribution || 0}
- Members: ${circleContext.members ? JSON.stringify(circleContext.members) : 'Unknown'}
- Current User Turn Number: ${circleContext.currentUser?.turnNumber || 'Unknown'}
- Current User ID: ${circleContext.currentUser?.id}

Use this context to accurately answer the user's questions. 
Keep your answers concise and directly related to the user's circle details if applicable.
  `.trim();

  // The Gemini SDK expects specific formats for history
  // Typically: { role: 'user' | 'model', parts: [{ text: string }] }
  const formattedMessages = messages.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content || msg.text || '' }]
  }));

  // Create a model instance with the system instructions
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt 
  });

  // Start chat with history (excluding the very last message which we will send to trigger the stream)
  const history = formattedMessages.slice(0, -1);
  const chat = model.startChat({ history });

  const latestMessageText = formattedMessages[formattedMessages.length - 1]?.parts[0]?.text || '';
  
  // Stream the response from Gemini
  const result = await chat.sendMessageStream(latestMessageText);

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
      } catch (e) {
        controller.error(e);
      } finally {
        controller.close();
      }
    }
  });

  return stream;
}
