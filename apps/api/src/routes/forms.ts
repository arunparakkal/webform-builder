import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@webform/db";
import { formDefinitionSchema } from "@webform/form-schema";
import { invalidatePublishedCache } from "../cache.js";
import { createForm, publishForm } from "../services/forms.js";

const createBody = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
});

const patchBody = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  draftDefinition: formDefinitionSchema.optional(),
});

export const formsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/forms", async (request, reply) => {
    const parsed = createBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    try {
      const form = await createForm(request.ownerId, parsed.data.title, parsed.data.slug);
      return reply.code(201).send(form);
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  app.get("/api/forms", async (request) => {
    return prisma.form.findMany({
      where: { ownerId: request.ownerId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedVersionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  app.get("/api/forms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const form = await prisma.form.findFirst({
      where: { id, ownerId: request.ownerId },
      include: {
        publishedVersion: true,
        versions: { orderBy: { revision: "desc" }, take: 10 },
      },
    });
    if (!form) return reply.code(404).send({ error: "Form not found" });
    return form;
  });

  app.patch("/api/forms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = patchBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const body = parsed.data;

    const existing = await prisma.form.findFirst({
      where: { id, ownerId: request.ownerId },
    });
    if (!existing) return reply.code(404).send({ error: "Form not found" });

    const form = await prisma.form.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        draftDefinition: body.draftDefinition,
      },
      include: {
        publishedVersion: true,
        versions: { orderBy: { revision: "desc" }, take: 10 },
      },
    });

    return form;
  });

  app.post("/api/forms/:id/publish", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await publishForm(id, request.ownerId);
      await invalidatePublishedCache(app.redis, result.form.slug);
      return reply.send({
        formId: result.form.id,
        slug: result.form.slug,
        status: result.form.status,
        versionId: result.version.id,
        revision: result.version.revision,
      });
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};
