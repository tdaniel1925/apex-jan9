/**
 * Claude AI Client Configuration
 * Following CodeBakers patterns from 14-ai.md
 */

// Lazy-load Anthropic client to avoid build-time initialization
// This allows the build to succeed even if the API key isn't set
let _anthropicClient: any = null;

export async function getAnthropicClient() {
  if (!_anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured - AI Copilot feature unavailable');
    }

    // Dynamic import to prevent SDK from being loaded at build time
    const { default: Anthropic } = await import('@anthropic-ai/sdk');

    _anthropicClient = new Anthropic({
      apiKey: apiKey,
    });
  }
  return _anthropicClient;
}

// Default models
export const CLAUDE_MODELS = {
  OPUS: 'claude-opus-4-5-20251101',
  SONNET: 'claude-3-5-sonnet-20241022',
  HAIKU: 'claude-3-5-haiku-20241022',
} as const;

// Token limits per model
export const TOKEN_LIMITS = {
  [CLAUDE_MODELS.OPUS]: 200000,
  [CLAUDE_MODELS.SONNET]: 200000,
  [CLAUDE_MODELS.HAIKU]: 200000,
} as const;

// Cost per million tokens (as of Jan 2025)
export const COST_PER_MILLION = {
  [CLAUDE_MODELS.OPUS]: { input: 15.0, output: 75.0 },
  [CLAUDE_MODELS.SONNET]: { input: 3.0, output: 15.0 },
  [CLAUDE_MODELS.HAIKU]: { input: 0.8, output: 4.0 },
} as const;

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  model: keyof typeof CLAUDE_MODELS,
  inputTokens: number,
  outputTokens: number
): number {
  const modelKey = CLAUDE_MODELS[model];
  const costs = COST_PER_MILLION[modelKey];

  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;

  return inputCost + outputCost;
}

/**
 * System prompts for different copilot contexts
 */
export const SYSTEM_PROMPTS = {
  GENERAL_ASSISTANT: `You are an AI assistant for insurance agents in the Apex Affinity Group MLM platform.
Help agents with:
- Understanding their commission structure
- Rank requirements and advancement
- Team building strategies
- Product knowledge
- Compliance guidelines

Be professional, accurate, and helpful. Always prioritize compliance and ethical practices.`,

  COMMISSION_ADVISOR: `You are a commission and compensation advisor for insurance agents.
Help agents understand:
- How their commissions are calculated
- Override structures (6 generations)
- Rank-based commission rates
- Fast start bonuses and other incentives
- 90-day premium requirements

Provide clear, accurate calculations and explanations.`,

  RANK_ADVISOR: `You are a rank advancement advisor for insurance agents.
Help agents understand:
- Current rank requirements
- Next rank requirements
- How to track progress
- Team building strategies
- Persistency and placement requirements

Be motivating while being realistic and ethical.`,
} as const;
