import { describe, expect, it } from "vitest";
import {
  formIdParamSchema,
  hourlyQuerySchema,
  hourlyRangeFromQuery,
  serializeHourlyBuckets,
} from "./hourly-query.js";

describe("hourly query helpers", () => {
  it("rejects a non-uuid form id instead of letting Prisma throw", () => {
    expect(formIdParamSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(formIdParamSchema.safeParse("bdda3b5f-8a7f-4d21-b2f2-a58a517a9634").success).toBe(
      true,
    );
  });

  it("falls back to a trailing hour window when from/to are omitted", () => {
    const parsed = hourlyQuerySchema.parse({});
    expect(parsed.hours).toBe(48);
    const range = hourlyRangeFromQuery(parsed);
    expect(range.to.getTime() - range.from.getTime()).toBe(48 * 60 * 60 * 1000);
  });

  it("rejects invalid hours so Fastify can return 400, not 500", () => {
    expect(hourlyQuerySchema.safeParse({ hours: 0 }).success).toBe(false);
    expect(hourlyQuerySchema.safeParse({ hours: "abc" }).success).toBe(false);
    expect(hourlyQuerySchema.safeParse({ from: "yesterday" }).success).toBe(false);
  });

  it("serializes BIGINT counts to JSON-safe numbers", () => {
    const start = new Date("2026-09-18T13:00:00.000Z");
    const end = new Date("2026-09-18T14:00:00.000Z");
    const out = serializeHourlyBuckets([
      {
        windowStart: start,
        windowEnd: end,
        submissionCount: 4n,
        updatedAt: new Date("2026-09-18T13:05:00.000Z"),
      },
    ]);
    expect(out.total).toBe(4);
    expect(out.buckets[0]!.count).toBe(4);
    expect(out.updatedAt).toBe("2026-09-18T13:05:00.000Z");
    expect(() => JSON.stringify(out)).not.toThrow();
  });
});
