import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { generateFormFromChat } from "../services/ai-forms.js";

const chatBody = z.object({
  message: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(12)
    .optional(),
});

export const aiRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/ai/forms", async (request, reply) => {
    if (!app.env.OPENAI_API_KEY) {
      return reply.code(503).send({
        error:
          "AI form builder is not configured. Set OPENAI_API_KEY in the API environment.",
      });
    }

    const parsed = chatBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    try {
      const result = await generateFormFromChat({
        ownerId: request.ownerId,
        message: parsed.data.message,
        history: parsed.data.history,
        apiKey: app.env.OPENAI_API_KEY,
        model: app.env.OPENAI_MODEL,
      });
      return result;
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      request.log.error({ err: e }, "ai form generation failed");
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};
