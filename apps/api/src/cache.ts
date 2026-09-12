import type { FormDefinition } from "@webform/form-schema";
import type { Redis } from "ioredis";

const TTL_SECONDS = 60 * 5;

export function publishedCacheKey(slug: string): string {
  return `published:form:${slug}`;
}

export type CachedPublishedForm = {
  formId: string;
  slug: string;
  formVersionId: string;
  revision: number;
  definition: FormDefinition;
};

async function withRedisTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Redis timed out")), ms);
    }),
  ]);
}

export async function getCachedPublished(
  redis: Redis,
  slug: string,
): Promise<CachedPublishedForm | null> {
  try {
    const raw = await withRedisTimeout(redis.get(publishedCacheKey(slug)));
    if (!raw) return null;
    return JSON.parse(raw) as CachedPublishedForm;
  } catch {
    return null;
  }
}

export async function setCachedPublished(
  redis: Redis,
  data: CachedPublishedForm,
): Promise<void> {
  try {
    await withRedisTimeout(
      redis.set(publishedCacheKey(data.slug), JSON.stringify(data), "EX", TTL_SECONDS),
    );
  } catch {
    // Cache is optional — Postgres remains source of truth.
  }
}

export async function invalidatePublishedCache(redis: Redis, slug: string): Promise<void> {
  try {
    await withRedisTimeout(redis.del(publishedCacheKey(slug)));
  } catch {
    // Publish must still succeed if Redis is down; public reads can fall back to Postgres.
  }
}
