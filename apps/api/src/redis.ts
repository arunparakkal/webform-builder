import { Redis } from "ioredis";

export function createRedis(url: string): Redis {
  const redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    connectTimeout: 3000,
    // Fail commands quickly when Redis is unavailable instead of hanging forever.
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 20) return null;
      return Math.min(times * 200, 2000);
    },
  });
  // Prevent process noise / crashes when Redis is briefly unreachable.
  redis.on("error", () => {
    /* logged by callers / fail-soft cache helpers */
  });
  return redis;
}
