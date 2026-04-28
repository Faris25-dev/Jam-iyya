import { GoogleGenerativeAI } from '@google/generative-ai';

import { trustScorePrompt } from './prompts';

const apiKey = process.env.GEMINI_API_KEY ?? '';

export const genAI = new GoogleGenerativeAI(apiKey);

export async function generateTrustScoreExplanation(prompt: string) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: trustScorePrompt,
  });

  const response = await model.generateContent(prompt);

  return response.response.text().trim();
}
