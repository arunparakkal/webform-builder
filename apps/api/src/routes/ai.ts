import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { generateFormFromChat, type AiProviderConfig } from "../services/ai-forms.js";

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

function resolveLlm(env: {
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
}): AiProviderConfig | null {
  if (env.GEMINI_API_KEY.trim()) {
    return {
      provider: "gemini",
      apiKey: env.GEMINI_API_KEY.trim(),
      model: env.GEMINI_MODEL,
    };
  }
  if (env.OPENAI_API_KEY.trim()) {
    return {
      provider: "openai",
      apiKey: env.OPENAI_API_KEY.trim(),
      model: env.OPENAI_MODEL,
    };
  }
  return null;
}

export const aiRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/ai/forms", async (request, reply) => {
    const llm = resolveLlm(app.env);
    if (!llm) {
      return reply.code(503).send({
        error:
          "AI form builder is not configured. Set GEMINI_API_KEY (free) or OPENAI_API_KEY on the API.",
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
        llm,
      });
      return result;
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      request.log.error({ err: e }, "ai form generation failed");
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};
