import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@webform/db";
import {
  formIdParamSchema,
  hourlyQuerySchema,
  hourlyRangeFromQuery,
  serializeHourlyBuckets,
} from "../hourly-query.js";

export const statsRoutes: FastifyPluginAsync = async (app) => {
  /** Pre-aggregated hourly counts. Reads only form_hourly_stats, never the submission rows. */
  app.get("/api/forms/:id/stats/hourly", async (request, reply) => {
    const id = formIdParamSchema.safeParse((request.params as { id: string }).id);
    if (!id.success) return reply.code(400).send({ error: "Invalid form id" });

    const parsed = hourlyQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const form = await prisma.form.findFirst({
      where: { id: id.data, ownerId: request.ownerId },
      select: { id: true },
    });
    if (!form) return reply.code(404).send({ error: "Form not found" });

    const { from, to } = hourlyRangeFromQuery(parsed.data);

    try {
      const rows = await prisma.formHourlyStat.findMany({
        where: { formId: id.data, windowStart: { gte: from, lte: to } },
        orderBy: { windowStart: "asc" },
      });
      const serialized = serializeHourlyBuckets(rows);
      return {
        formId: id.data,
        from: from.toISOString(),
        to: to.toISOString(),
        ...serialized,
      };
    } catch (err) {
      request.log.error({ err }, "hourly stats read failed");
      // Chart is optional; keep the inbox usable if the stats table is briefly unavailable.
      return {
        formId: id.data,
        from: from.toISOString(),
        to: to.toISOString(),
        buckets: [],
        total: 0,
        updatedAt: null,
      };
    }
  });

  /**
   * Owner-wide keyed state: one row per (form, UTC hour).
   * Same table the worker increments; this is the dashboard read of that map.
   */
  app.get("/api/stats/hourly", async (request, reply) => {
    const parsed = hourlyQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { from, to } = hourlyRangeFromQuery(parsed.data);

    try {
      const rows = await prisma.formHourlyStat.findMany({
        where: {
          form: { ownerId: request.ownerId },
          windowStart: { gte: from, lte: to },
        },
        include: { form: { select: { id: true, title: true, slug: true } } },
        orderBy: [{ windowStart: "asc" }, { formId: "asc" }],
      });

      return {
        from: from.toISOString(),
        to: to.toISOString(),
        keys: rows
          .map((row) => ({
            formId: row.formId,
            formTitle: row.form.title,
            formSlug: row.form.slug,
            windowStart: row.windowStart.toISOString(),
            windowEnd: row.windowEnd.toISOString(),
            count: Number(row.submissionCount) || 0,
          }))
          .filter((row) => row.count > 0),
      };
    } catch (err) {
      request.log.error({ err }, "keyed hourly stats read failed");
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        keys: [],
      };
    }
  });
};
