import type { FastifyPluginAsync } from "fastify";
import { Readable } from "node:stream";
import { prisma } from "@webform/db";
import {
  formDefinitionSchema,
  type FormDefinition,
} from "@webform/form-schema";
import { z } from "zod";

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  revision: z.coerce.number().int().positive().optional(),
});

const exportQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  revision: z.coerce.number().int().positive().optional(),
});

const EXPORT_BATCH = 500;

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function buildWhere(
  formId: string,
  query: {
    from?: string;
    to?: string;
    revision?: number;
    cursor?: string;
  },
) {
  return {
    formId,
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
    ...(query.revision ? { formVersion: { revision: query.revision } } : {}),
    ...(query.cursor
      ? (() => {
          const idx = query.cursor.lastIndexOf("_");
          const createdAt = new Date(query.cursor.slice(0, idx));
          const cursorId = query.cursor.slice(idx + 1);
          return {
            OR: [
              { createdAt: { lt: createdAt } },
              { createdAt, id: { lt: cursorId } },
            ],
          };
        })()
      : {}),
  };
}

export const submissionsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/forms/:id/submissions", async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = listQuery.parse(request.query);

    const form = await prisma.form.findFirst({
      where: { id, ownerId: request.ownerId },
      select: { id: true },
    });
    if (!form) return reply.code(404).send({ error: "Form not found" });

    const where = buildWhere(id, query);
    const skip = (query.page - 1) * query.limit;

    const [total, rows] = await Promise.all([
      prisma.formSubmission.count({ where }),
      prisma.formSubmission.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: query.limit,
        include: {
          formVersion: { select: { id: true, revision: true, definition: true } },
        },
      }),
    ]);

    const pageCount = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      items: rows.map((row) => ({
        id: row.id,
        formVersionId: row.formVersionId,
        revision: row.formVersion.revision,
        payload: row.payload,
        createdAt: row.createdAt,
      })),
      total,
      page: query.page,
      limit: query.limit,
      pageCount,
      /** Kept for older clients; prefer page/total for inbox UI. */
      nextCursor: query.page < pageCount && rows.length > 0
        ? `${rows[rows.length - 1]!.createdAt.toISOString()}_${rows[rows.length - 1]!.id}`
        : null,
    };
  });

  app.get("/api/forms/:id/submissions/export", async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = exportQuery.parse(request.query);

    const form = await prisma.form.findFirst({
      where: { id, ownerId: request.ownerId },
      select: { id: true, title: true },
    });
    if (!form) return reply.code(404).send({ error: "Form not found" });

    // Column set from versions (bounded), not from loading every submission.
    const versions = await prisma.formVersion.findMany({
      where: {
        formId: id,
        ...(query.revision ? { revision: query.revision } : {}),
      },
      select: { definition: true },
    });
    const nameSet = new Set<string>();
    for (const version of versions) {
      const def = formDefinitionSchema.parse(version.definition) as FormDefinition;
      for (const field of def.fields) nameSet.add(field.name);
    }
    const columns = ["id", "revision", "created_at", ...Array.from(nameSet)];

    const filename = `${form.title.replaceAll(/[^a-z0-9-_]+/gi, "_")}-submissions.csv`;
    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header("content-disposition", `attachment; filename="${filename}"`);

    async function* csvRows() {
      yield `${columns.map(escapeCsv).join(",")}\n`;

      let cursor: string | undefined;
      for (;;) {
        const batch = await prisma.formSubmission.findMany({
          where: buildWhere(id, { ...query, cursor }),
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: EXPORT_BATCH,
          include: { formVersion: { select: { revision: true } } },
        });
        if (batch.length === 0) break;

        for (const row of batch) {
          const payload = row.payload as Record<string, unknown>;
          const values = columns.map((col) => {
            if (col === "id") return escapeCsv(row.id);
            if (col === "revision") return String(row.formVersion.revision);
            if (col === "created_at") return escapeCsv(row.createdAt.toISOString());
            const v = payload[col];
            if (v === undefined || v === null) return "";
            return escapeCsv(Array.isArray(v) ? v.join("|") : String(v));
          });
          yield `${values.join(",")}\n`;
        }

        if (batch.length < EXPORT_BATCH) break;
        const last = batch[batch.length - 1]!;
        cursor = `${last.createdAt.toISOString()}_${last.id}`;
      }
    }

    return reply.send(Readable.from(csvRows()));
  });
};
