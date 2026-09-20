import { describe, expect, it, vi } from "vitest";
import {
  formIdParamSchema,
  getHourlyAnalytics,
  hourlyAnalyticsQuerySchema,
  rangeFromQuery,
  serializeHourlyAnalytics,
} from "./hourly-analytics.js";

const FORM_ID = "0dbdd8c8-8b76-4858-88ff-8cc821d94ad8";
const OWNER_ID = "b8785d00-0cc4-445a-814d-53a66fee648c";

function row(start: string, end: string, count: bigint) {
  return {
    windowStart: new Date(start),
    windowEnd: new Date(end),
    submissionCount: count,
  };
}

describe("hourly analytics query", () => {
  it("accepts optional start and end ISO timestamps", () => {
    expect(hourlyAnalyticsQuerySchema.safeParse({}).success).toBe(true);
    expect(
      hourlyAnalyticsQuerySchema.safeParse({
        start: "2026-09-20T10:00:00.000Z",
        end: "2026-09-20T12:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid timestamps and a start that is not before end", () => {
    expect(hourlyAnalyticsQuerySchema.safeParse({ start: "yesterday" }).success).toBe(
      false,
    );
    expect(
      hourlyAnalyticsQuerySchema.safeParse({
        start: "2026-09-20T12:00:00.000Z",
        end: "2026-09-20T10:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("treats end as exclusive on windowStart", () => {
    const range = rangeFromQuery({
      start: "2026-09-20T10:00:00.000Z",
      end: "2026-09-20T11:00:00.000Z",
    });
    expect(range.start?.toISOString()).toBe("2026-09-20T10:00:00.000Z");
    expect(range.end?.toISOString()).toBe("2026-09-20T11:00:00.000Z");
  });
});

describe("getHourlyAnalytics", () => {
  it("rejects a non-uuid form id", async () => {
    await expect(
      getHourlyAnalytics(OWNER_ID, "not-a-uuid", {}, {
        findOwnedForm: vi.fn(),
        findHourlyStats: vi.fn(),
      }),
    ).rejects.toMatchObject({ statusCode: 400, message: "Invalid form id" });
    expect(formIdParamSchema.safeParse("not-a-uuid").success).toBe(false);
  });

  it("returns 404 when the form is missing or owned by someone else", async () => {
    const findHourlyStats = vi.fn();
    await expect(
      getHourlyAnalytics(OWNER_ID, FORM_ID, {}, {
        findOwnedForm: vi.fn().mockResolvedValue(null),
        findHourlyStats,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(findHourlyStats).not.toHaveBeenCalled();
  });

  it("returns chronological Flink rows without reading submissions", async () => {
    const findHourlyStats = vi.fn().mockResolvedValue([
      row("2026-09-20T11:00:00.000Z", "2026-09-20T12:00:00.000Z", 2n),
      row("2026-09-20T10:00:00.000Z", "2026-09-20T11:00:00.000Z", 3n),
    ]);
    const result = await getHourlyAnalytics(
      OWNER_ID,
      FORM_ID,
      { start: "2026-09-20T10:00:00.000Z", end: "2026-09-20T12:00:00.000Z" },
      {
        findOwnedForm: vi.fn().mockResolvedValue({ id: FORM_ID }),
        findHourlyStats,
      },
    );
    expect(findHourlyStats).toHaveBeenCalledWith(FORM_ID, {
      start: new Date("2026-09-20T10:00:00.000Z"),
      end: new Date("2026-09-20T12:00:00.000Z"),
    });
    expect(result).toEqual({
      formId: FORM_ID,
      data: [
        {
          windowStart: "2026-09-20T10:00:00.000Z",
          windowEnd: "2026-09-20T11:00:00.000Z",
          submissionCount: 3,
        },
        {
          windowStart: "2026-09-20T11:00:00.000Z",
          windowEnd: "2026-09-20T12:00:00.000Z",
          submissionCount: 2,
        },
      ],
    });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("serializes BIGINT counts to JSON-safe numbers", () => {
    const out = serializeHourlyAnalytics(FORM_ID, [
      row("2026-09-20T10:00:00.000Z", "2026-09-20T11:00:00.000Z", 123n),
    ]);
    expect(out.data[0]!.submissionCount).toBe(123);
  });
});
