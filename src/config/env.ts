import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  LUNCHDROP_EMAIL: z.string().optional(),
  LUNCHDROP_PASSWORD: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  PORT: z.string().default('3000'),
  FRONTEND_PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_PATH: z.string().default('./data/lunchdrop.db'),
  NOTIFICATION_ENABLED: z.string().default('false'),
  SLACK_WEBHOOK_URL: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().optional(),
  AUTO_SUBMIT_ENABLED: z.string().default('false'),
  MAX_BUDGET: z.string().default('18.00'),
  TARGET_CALORIES: z.string().default('1000'),
  TARGET_PROTEIN: z.string().default('60'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success ? parsed.data : envSchema.parse({});

export const config = {
  lunchdrop: {
    email: env.LUNCHDROP_EMAIL,
    password: env.LUNCHDROP_PASSWORD,
  },
  ai: {
    provider: env.AI_PROVIDER,
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
    },
  },
  server: {
    port: parseInt(env.PORT, 10),
    frontendPort: parseInt(env.FRONTEND_PORT, 10),
    nodeEnv: env.NODE_ENV,
  },
  database: {
    path: env.DATABASE_PATH,
  },
  notifications: {
    enabled: env.NOTIFICATION_ENABLED === 'true',
    slackWebhook: env.SLACK_WEBHOOK_URL,
    discordWebhook: env.DISCORD_WEBHOOK_URL,
  },
  order: {
    autoSubmit: env.AUTO_SUBMIT_ENABLED === 'true',
    maxBudget: parseFloat(env.MAX_BUDGET),
    targetCalories: parseInt(env.TARGET_CALORIES, 10),
    targetProtein: parseInt(env.TARGET_PROTEIN, 10),
  },
};
