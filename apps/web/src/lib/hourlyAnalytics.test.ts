import { describe, expect, it } from "vitest";
import {
  hourlyAnalyticsPath,
  hourlyChartWindow,
  resolveHourlyAnalyticsQuery,
} from "./hourlyAnalytics";

describe("resolveHourlyAnalyticsQuery", () => {
  it("uses the last N hours when start and end are omitted", () => {
    const now = new Date("2026-09-20T12:00:00.000Z");
    expect(resolveHourlyAnalyticsQuery({ hours: 24, now })).toEqual({
      start: "2026-09-19T12:00:00.000Z",
      end: "2026-09-20T12:00:00.000Z",
    });
  });

  it("keeps explicit inbox timestamps", () => {
    expect(
      resolveHourlyAnalyticsQuery({
        start: "2026-09-20T10:00:00.000Z",
        end: "2026-09-20T11:00:00.000Z",
      }),
    ).toEqual({
      start: "2026-09-20T10:00:00.000Z",
      end: "2026-09-20T11:00:00.000Z",
    });
  });
});

describe("hourlyAnalyticsPath", () => {
  it("targets GET /api/forms/:formId/analytics/hourly", () => {
    expect(hourlyAnalyticsPath("form-1")).toBe("/api/forms/form-1/analytics/hourly");
    expect(
      hourlyAnalyticsPath("form-1", {
        start: "2026-09-20T10:00:00.000Z",
        end: "2026-09-20T11:00:00.000Z",
      }),
    ).toBe(
      "/api/forms/form-1/analytics/hourly?start=2026-09-20T10%3A00%3A00.000Z&end=2026-09-20T11%3A00%3A00.000Z",
    );
  });
});

describe("hourlyChartWindow", () => {
  it("sizes the chart from an explicit start/end range", () => {
    const window = hourlyChartWindow({
      start: "2026-09-20T08:00:00.000Z",
      end: "2026-09-20T12:00:00.000Z",
    });
    expect(window.hours).toBe(4);
    expect(window.now.toISOString()).toBe("2026-09-20T12:00:00.000Z");
  });
});
