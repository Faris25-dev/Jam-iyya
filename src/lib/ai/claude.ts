import Anthropic from '@anthropic-ai/sdk';

import { trustScorePrompt } from './prompts';

const apiKey = process.env.ANTHROPIC_API_KEY ?? '';

export const anthropic = new Anthropic({ apiKey });

export async function generateTrustScoreExplanation(prompt: string) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured.');
  }

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    system: trustScorePrompt,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content
    .flatMap((item) => ('text' in item ? [item.text] : []))
    .join('')
    .trim();
}