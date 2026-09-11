import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  JWT_SECRET: z.string().min(16).default("dev-only-change-me-jwt-secret"),
  DEMO_OWNER_EMAIL: z.string().email().default("owner@example.com"),
  DEMO_OWNER_PASSWORD: z.string().min(8).default("password123"),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(60),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
