import type { Redis } from "ioredis";

/** Fixed-window per-form (+ optional IP) rate limit. Returns true if allowed. */
export async function allowRequest(
  redis: Redis,
  formId: string,
  ip: string,
  limitPerMinute: number,
): Promise<boolean> {
  const minute = Math.floor(Date.now() / 60_000);
  const formKey = `rl:form:${formId}:${minute}`;
  const ipKey = `rl:form:${formId}:ip:${ip}:${minute}`;

  const formCount = await redis.incr(formKey);
  if (formCount === 1) await redis.expire(formKey, 70);

  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, 70);

  const ipLimit = Math.max(10, Math.floor(limitPerMinute / 2));
  return formCount <= limitPerMinute && ipCount <= ipLimit;
}
