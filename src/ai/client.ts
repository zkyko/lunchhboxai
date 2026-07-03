import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';
import { AIProvider } from '../types/index.js';

let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!config.ai.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });
  }
  return openaiClient;
}

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!config.ai.anthropic.apiKey) {
      throw new Error('Anthropic API key not configured');
    }
    anthropicClient = new Anthropic({
      apiKey: config.ai.anthropic.apiKey,
    });
  }
  return anthropicClient;
}

export async function chat(
  prompt: string,
  options: {
    provider?: AIProvider;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const provider = options.provider || config.ai.provider;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 2000;

  if (provider === 'anthropic') {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: config.ai.anthropic.model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  } else {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: config.ai.openai.model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }
}

export async function chatJSON<T>(
  prompt: string,
  options: {
    provider?: AIProvider;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<T> {
  const response = await chat(prompt, {
    ...options,
    temperature: options.temperature ?? 0.3,
  });

  const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]) as T;
}
