import type { FastifyPluginAsync } from "fastify";
import type { Redis } from "ioredis";
import { prisma } from "@webform/db";
import {
  formDefinitionSchema,
  type FormDefinition,
} from "@webform/form-schema";
import {
  getCachedPublished,
  setCachedPublished,
  type CachedPublishedForm,
} from "../cache.js";
import { Queue } from "bullmq";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { SUBMISSION_QUEUE_NAME, type SubmissionJobData } from "../queue.js";
import { allowRequest } from "../rate-limit.js";
import { parseSubmission } from "@webform/form-schema";

const submitBody = z.object({
  payload: z.record(z.unknown()),
  website: z.string().optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

const ownerIdParam = z.string().uuid();
const slugParam = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

async function loadPublished(
  ownerId: string,
  slug: string,
  redis: Redis,
): Promise<CachedPublishedForm | null> {
  const cached = await getCachedPublished(redis, ownerId, slug);
  if (cached?.ownerId === ownerId) return cached;

  const form = await prisma.form.findFirst({
    where: { ownerId, slug },
    include: { publishedVersion: true },
  });
  if (!form?.publishedVersion) return null;

  const definition = formDefinitionSchema.parse(
    form.publishedVersion.definition,
  ) as FormDefinition;
  const data: CachedPublishedForm = {
    formId: form.id,
    ownerId: form.ownerId,
    slug: form.slug,
    formVersionId: form.publishedVersion.id,
    revision: form.publishedVersion.revision,
    definition,
  };
  await setCachedPublished(redis, data);
  return data;
}

export const publicRoutes: FastifyPluginAsync = async (app) => {
  const queue = new Queue<SubmissionJobData>(SUBMISSION_QUEUE_NAME, {
    connection: app.redis.duplicate(),
  });
  app.addHook("onClose", async () => {
    await queue.close();
  });

  app.get("/api/public/forms/:ownerId/:slug", async (request, reply) => {
    const ownerId = ownerIdParam.safeParse((request.params as { ownerId: string }).ownerId);
    const slug = slugParam.safeParse((request.params as { slug: string }).slug);
    if (!ownerId.success || !slug.success) {
      return reply.code(400).send({ error: "Invalid owner or slug" });
    }

    const published = await loadPublished(ownerId.data, slug.data, app.redis);
    if (!published) return reply.code(404).send({ error: "Form not published" });

    return {
      ownerId: published.ownerId,
      slug: published.slug,
      revision: published.revision,
      formVersionId: published.formVersionId,
      definition: published.definition,
    };
  });

  app.post("/api/public/forms/:ownerId/:slug/submissions", async (request, reply) => {
    const ownerId = ownerIdParam.safeParse((request.params as { ownerId: string }).ownerId);
    const slug = slugParam.safeParse((request.params as { slug: string }).slug);
    if (!ownerId.success || !slug.success) {
      return reply.code(400).send({ error: "Invalid owner or slug" });
    }

    const body = submitBody.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: body.error.flatten() });
    }

    if (body.data.website && body.data.website.length > 0) {
      return reply.code(202).send({ accepted: true });
    }

    const published = await loadPublished(ownerId.data, slug.data, app.redis);
    if (!published) return reply.code(404).send({ error: "Form not published" });

    const ip = request.ip || "unknown";
    const allowed = await allowRequest(app.redis, {
      formId: published.formId,
      ownerId: published.ownerId,
      ip,
      formLimitPerMinute: app.env.RATE_LIMIT_PER_MINUTE,
      ownerLimitPerMinute: app.env.RATE_LIMIT_OWNER_PER_MINUTE,
    });
    if (!allowed) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const validated = parseSubmission(published.definition, body.data.payload);
    if (!validated.success) {
      return reply.code(400).send({ error: validated.error.flatten() });
    }

    const idempotencyKey = body.data.idempotencyKey ?? randomUUID();

    await queue.add(
      "persist",
      {
        formId: published.formId,
        formVersionId: published.formVersionId,
        payload: validated.data,
        idempotencyKey,
      },
      {
        jobId: idempotencyKey,
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
      },
    );

    return reply.code(202).send({
      accepted: true,
      idempotencyKey,
      formVersionId: published.formVersionId,
    });
  });
};
