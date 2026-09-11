import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Redis } from "ioredis";
import { prisma } from "@webform/db";
import type { Env } from "./env.js";
import type { AuthUser } from "./services/auth.js";
import { authRoutes, requireAuth } from "./routes/auth.js";
import { formsRoutes } from "./routes/forms.js";
import { publicRoutes } from "./routes/public.js";
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

  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(publicRoutes);

  await app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", requireAuth);
    await protectedApp.register(formsRoutes);
    await protectedApp.register(submissionsRoutes);
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
