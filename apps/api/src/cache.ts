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

export async function getCachedPublished(
  redis: Redis,
  slug: string,
): Promise<CachedPublishedForm | null> {
  const raw = await redis.get(publishedCacheKey(slug));
  if (!raw) return null;
  return JSON.parse(raw) as CachedPublishedForm;
}

export async function setCachedPublished(
  redis: Redis,
  data: CachedPublishedForm,
): Promise<void> {
  await redis.set(publishedCacheKey(data.slug), JSON.stringify(data), "EX", TTL_SECONDS);
}

export async function invalidatePublishedCache(redis: Redis, slug: string): Promise<void> {
  await redis.del(publishedCacheKey(slug));
}
