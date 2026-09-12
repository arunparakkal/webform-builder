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
    const base = {
      formId: "form-1",
      ownerId: "owner-1",
      formLimitPerMinute: 2,
      ownerLimitPerMinute: 100,
    };
    expect(await allowRequest(redis, { ...base, ip: "1.1.1.1" })).toBe(true);
    expect(await allowRequest(redis, { ...base, ip: "1.1.1.2" })).toBe(true);
    expect(await allowRequest(redis, { ...base, ip: "1.1.1.3" })).toBe(false);
  });

  it("blocks when the per-owner limit is exceeded across forms", async () => {
    const redis = new FakeRedis() as unknown as import("ioredis").Redis;
    expect(
      await allowRequest(redis, {
        formId: "form-a",
        ownerId: "owner-noisy",
        ip: "1.1.1.1",
        formLimitPerMinute: 50,
        ownerLimitPerMinute: 2,
      }),
    ).toBe(true);
    expect(
      await allowRequest(redis, {
        formId: "form-b",
        ownerId: "owner-noisy",
        ip: "1.1.1.2",
        formLimitPerMinute: 50,
        ownerLimitPerMinute: 2,
      }),
    ).toBe(true);
    expect(
      await allowRequest(redis, {
        formId: "form-c",
        ownerId: "owner-noisy",
        ip: "1.1.1.3",
        formLimitPerMinute: 50,
        ownerLimitPerMinute: 2,
      }),
    ).toBe(false);
  });

  it("does not apply one owner's limit to another owner", async () => {
    const redis = new FakeRedis() as unknown as import("ioredis").Redis;
    expect(
      await allowRequest(redis, {
        formId: "form-a",
        ownerId: "owner-1",
        ip: "1.1.1.1",
        formLimitPerMinute: 50,
        ownerLimitPerMinute: 1,
      }),
    ).toBe(true);
    expect(
      await allowRequest(redis, {
        formId: "form-b",
        ownerId: "owner-2",
        ip: "1.1.1.2",
        formLimitPerMinute: 50,
        ownerLimitPerMinute: 1,
      }),
    ).toBe(true);
  });
});
