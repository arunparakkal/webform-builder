import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Redis } from "ioredis";
import { prisma } from "@webform/db";
import type { Env } from "./env.js";
import { formsRoutes } from "./routes/forms.js";
import { publicRoutes } from "./routes/public.js";
import { submissionsRoutes } from "./routes/submissions.js";
import { ensureDemoOwner } from "./services/forms.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
    env: Env;
  }
  interface FastifyRequest {
    ownerId: string;
  }
}

export async function buildApp(env: Env, redis: Redis) {
  const app = Fastify({ logger: true });
  app.decorate("redis", redis);
  app.decorate("env", env);

  await app.register(cors, { origin: true });

  const owner = await ensureDemoOwner(env.DEMO_OWNER_EMAIL);

  app.addHook("onRequest", async (request) => {
    const header = request.headers["x-owner-id"];
    request.ownerId = typeof header === "string" && header.length > 0 ? header : owner.id;
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(formsRoutes);
  await app.register(publicRoutes);
  await app.register(submissionsRoutes);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
