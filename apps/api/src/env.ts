import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/** Load key=value pairs from the nearest repo `.env` into process.env (without overriding). */
function loadRootEnvFile() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, "../../../.env"), // apps/api/src → repo root
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
    break;
  }
}

loadRootEnvFile();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  JWT_SECRET: z.string().min(16).default("dev-only-change-me-jwt-secret"),
  DEMO_OWNER_EMAIL: z.string().email().default("owner@example.com"),
  DEMO_OWNER_PASSWORD: z.string().min(8).default("password123"),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(60),
  /** Cap total public submits across all forms owned by one tenant per minute. */
  RATE_LIMIT_OWNER_PER_MINUTE: z.coerce.number().default(180),
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_ANON_KEY: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
