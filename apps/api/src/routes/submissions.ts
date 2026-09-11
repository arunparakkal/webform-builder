import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@webform/db";
import {
  formDefinitionSchema,
  type FormDefinition,
} from "@webform/form-schema";
import { z } from "zod";

const listQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  revision: z.coerce.number().int().positive().optional(),
});

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
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

    const where = {
      formId: id,
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.revision
        ? { formVersion: { revision: query.revision } }
        : {}),
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

    const rows = await prisma.formSubmission.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      include: {
        formVersion: { select: { id: true, revision: true, definition: true } },
      },
    });

    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    const last = items[items.length - 1];
    const nextCursor = hasMore && last ? `${last.createdAt.toISOString()}_${last.id}` : null;

    return {
      items: items.map((row) => ({
        id: row.id,
        formVersionId: row.formVersionId,
        revision: row.formVersion.revision,
        payload: row.payload,
        createdAt: row.createdAt,
      })),
      nextCursor,
    };
  });

  app.get("/api/forms/:id/submissions/export", async (request, reply) => {
    const { id } = request.params as { id: string };
    const form = await prisma.form.findFirst({
      where: { id, ownerId: request.ownerId },
      select: { id: true, title: true },
    });
    if (!form) return reply.code(404).send({ error: "Form not found" });

    const rows = await prisma.formSubmission.findMany({
      where: { formId: id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10_000,
      include: { formVersion: true },
    });

    const nameSet = new Set<string>();
    for (const row of rows) {
      const def = formDefinitionSchema.parse(row.formVersion.definition) as FormDefinition;
      for (const field of def.fields) nameSet.add(field.name);
    }
    const columns = ["id", "revision", "created_at", ...Array.from(nameSet)];

    const lines = [columns.map(escapeCsv).join(",")];
    for (const row of rows) {
      const payload = row.payload as Record<string, unknown>;
      const values = columns.map((col) => {
        if (col === "id") return escapeCsv(row.id);
        if (col === "revision") return String(row.formVersion.revision);
        if (col === "created_at") return escapeCsv(row.createdAt.toISOString());
        const v = payload[col];
        if (v === undefined || v === null) return "";
        return escapeCsv(Array.isArray(v) ? v.join("|") : String(v));
      });
      lines.push(values.join(","));
    }

    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header(
      "content-disposition",
      `attachment; filename="${form.title.replaceAll(/[^a-z0-9-_]+/gi, "_")}-submissions.csv"`,
    );
    return reply.send(lines.join("\n"));
  });
};
