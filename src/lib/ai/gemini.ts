import { GoogleGenerativeAI } from '@google/generative-ai';

import { trustScorePrompt } from './prompts';

const apiKey = process.env.GEMINI_API_KEY ?? '';

export const genAI = new GoogleGenerativeAI(apiKey);

export async function generateTrustScoreExplanation(prompt: string) {
  if (!apiKey) {
    return [
      'Demo trust insight: your score is calculated from verified identity, payment history, wallet activity, circle participation, and profile completeness.',
      'Add GEMINI_API_KEY to enable the live AI-generated explanation.',
    ].join(' ');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: trustScorePrompt,
  });

  const response = await model.generateContent(prompt);

  return response.response.text().trim();
}
