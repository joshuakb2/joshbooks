import { z } from "zod";

export const serverScheme = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GOOGLE_ID: z.string(),
  GOOGLE_SECRET: z.string(),
  AUTH_SECRET: z.string(),
  PG_HOSTNAME: z.string(),
  PG_USERNAME: z.string(),
  PG_PASSWORD: z.string(),
  PG_DATABASE: z.string(),
  AUTH_TRUST_HOST: z.string().optional(),
  AUTH_URL: z.string().optional(),
});

export const clientScheme = z.object({
  MODE: z.enum(['development', 'production', 'test']).default('development'),
});
