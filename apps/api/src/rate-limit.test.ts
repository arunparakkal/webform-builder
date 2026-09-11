import { describe, expect, it } from "vitest";
import { allowRequest } from "./rate-limit.js";

class FakeRedis {
  store = new Map<string, number>();
  async incr(key: string) {
    const next = (this.store.get(key) ?? 0) + 1;
    this.store.set(key, next);
    return next;
  }
  async expire() {
    return 1;
  }
}

describe("allowRequest", () => {
  it("blocks when the per-form limit is exceeded", async () => {
    const redis = new FakeRedis() as unknown as import("ioredis").Redis;
    const formId = "form-1";
    expect(await allowRequest(redis, formId, "1.1.1.1", 2)).toBe(true);
    expect(await allowRequest(redis, formId, "1.1.1.2", 2)).toBe(true);
    expect(await allowRequest(redis, formId, "1.1.1.3", 2)).toBe(false);
  });
});
