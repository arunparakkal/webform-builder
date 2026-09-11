import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
  authenticateUser,
  createUser,
  signAccessToken,
  signinSchema,
  signupSchema,
  verifyAccessToken,
} from "../services/auth.js";
import { prisma } from "@webform/db";

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = bearerToken(request);
  if (!token) {
    return reply.code(401).send({ error: "Sign in required" });
  }
  try {
    const payload = await verifyAccessToken(token, request.server.env.JWT_SECRET);
    request.ownerId = payload.id;
    request.authUser = payload;
  } catch {
    return reply.code(401).send({ error: "Invalid or expired session" });
  }
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/auth/signup", async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    try {
      const user = await createUser(parsed.data);
      const token = await signAccessToken(user, app.env.JWT_SECRET);
      return reply.code(201).send({ token, user });
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  app.post("/api/auth/signin", async (request, reply) => {
    const parsed = signinSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    try {
      const user = await authenticateUser(parsed.data.email, parsed.data.password);
      const token = await signAccessToken(user, app.env.JWT_SECRET);
      return reply.send({ token, user });
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  app.get("/api/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.ownerId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) return reply.code(401).send({ error: "User not found" });
    return { user };
  });
};
