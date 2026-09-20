import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Redis } from "ioredis";
import { prisma } from "@webform/db";
import type { Env } from "./env.js";
import type { AuthUser } from "./services/auth.js";
import { aiRoutes } from "./routes/ai.js";
import { authRoutes, requireAuth } from "./routes/auth.js";
import { formsRoutes } from "./routes/forms.js";
import { publicRoutes } from "./routes/public.js";
import { statsRoutes } from "./routes/stats.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { submissionsRoutes } from "./routes/submissions.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
    env: Env;
  }
  interface FastifyRequest {
    ownerId: string;
    authUser?: AuthUser;
  }
}

export async function buildApp(env: Env, redis: Redis) {
  const app = Fastify({ logger: true });
  app.decorate("redis", redis);
  app.decorate("env", env);

  await app.register(cors, {
    origin: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    return payload;
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(publicRoutes);

  await app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", requireAuth);
    await protectedApp.register(formsRoutes);
    await protectedApp.register(submissionsRoutes);
    await protectedApp.register(statsRoutes);
    await protectedApp.register(analyticsRoutes);
    await protectedApp.register(aiRoutes);
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
