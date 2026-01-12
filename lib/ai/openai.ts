/**
 * OpenAI Client Configuration
 * Following CodeBakers 14-ai.md patterns
 */

import OpenAI from 'openai';

// Validate environment - only throw in runtime, not at import time
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not set - AI features will use fallback responses');
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export const openai = getOpenAIClient();

// Default models
export const MODELS = {
  GPT4: 'gpt-4-turbo-preview',
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  GPT35: 'gpt-3.5-turbo',
  EMBEDDING: 'text-embedding-3-small',
} as const;

// Cost per 1K tokens (in cents)
export const TOKEN_COSTS = {
  'gpt-4-turbo-preview': { input: 1, output: 3 },
  'gpt-4o': { input: 0.25, output: 1 },
  'gpt-4o-mini': { input: 0.015, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.05, output: 0.15 },
} as const;
