import type { Redis } from "ioredis";

export type RateLimitInput = {
  formId: string;
  ownerId: string;
  ip: string;
  /** Max accepted submits for one form per minute. */
  formLimitPerMinute: number;
  /** Max accepted submits across all of one owner's forms per minute. */
  ownerLimitPerMinute: number;
};

/**
 * Fixed-window limits: per-form, per-IP (on that form), and per-owner (tenant).
 * Returns true if the request is allowed.
 */
export async function allowRequest(redis: Redis, input: RateLimitInput): Promise<boolean> {
  const { formId, ownerId, ip, formLimitPerMinute, ownerLimitPerMinute } = input;
  const minute = Math.floor(Date.now() / 60_000);

  const formKey = `rl:form:${formId}:${minute}`;
  const ipKey = `rl:form:${formId}:ip:${ip}:${minute}`;
  const ownerKey = `rl:owner:${ownerId}:${minute}`;

  const formCount = await redis.incr(formKey);
  if (formCount === 1) await redis.expire(formKey, 70);

  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, 70);

  const ownerCount = await redis.incr(ownerKey);
  if (ownerCount === 1) await redis.expire(ownerKey, 70);

  const ipLimit = Math.max(10, Math.floor(formLimitPerMinute / 2));
  return (
    formCount <= formLimitPerMinute &&
    ipCount <= ipLimit &&
    ownerCount <= ownerLimitPerMinute
  );
}
