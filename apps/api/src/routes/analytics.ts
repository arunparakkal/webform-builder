import type { FastifyPluginAsync } from "fastify";
import {
  formIdParamSchema,
  getHourlyAnalytics,
  hourlyAnalyticsQuerySchema,
} from "../services/hourly-analytics.js";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/forms/:formId/analytics/hourly", async (request, reply) => {
    const formId = formIdParamSchema.safeParse(
      (request.params as { formId: string }).formId,
    );
    if (!formId.success) {
      return reply.code(400).send({ error: "Invalid form id" });
    }

    const query = hourlyAnalyticsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: query.error.flatten() });
    }

    try {
      return await getHourlyAnalytics(request.ownerId, formId.data, query.data);
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};
