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

async function loadPublished(
  slug: string,
  redis: Redis,
): Promise<CachedPublishedForm | null> {
  const cached = await getCachedPublished(redis, slug);
  if (cached) return cached;

  const form = await prisma.form.findUnique({
    where: { slug },
    include: { publishedVersion: true },
  });
  if (!form?.publishedVersion) return null;

  const definition = formDefinitionSchema.parse(
    form.publishedVersion.definition,
  ) as FormDefinition;
  const data: CachedPublishedForm = {
    formId: form.id,
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

  app.get("/api/public/forms/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const published = await loadPublished(slug, app.redis);
    if (!published) return reply.code(404).send({ error: "Form not published" });

    return {
      slug: published.slug,
      revision: published.revision,
      formVersionId: published.formVersionId,
      definition: published.definition,
    };
  });

  app.post("/api/public/forms/:slug/submissions", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const body = submitBody.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: body.error.flatten() });
    }

    if (body.data.website && body.data.website.length > 0) {
      return reply.code(202).send({ accepted: true });
    }

    const published = await loadPublished(slug, app.redis);
    if (!published) return reply.code(404).send({ error: "Form not published" });

    const ip = request.ip || "unknown";
    const allowed = await allowRequest(
      app.redis,
      published.formId,
      ip,
      app.env.RATE_LIMIT_PER_MINUTE,
    );
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
