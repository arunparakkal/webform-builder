import { describe, expect, it } from "vitest";
import {
  analyticsToBuckets,
  buildHourlySeries,
  formatHourKey,
  formatHourRange,
  formatKeyedStateLine,
} from "./hourlySeries";

describe("buildHourlySeries", () => {
  it("places a UTC bucket on the matching hour even when local time is offset", () => {
    const now = new Date("2026-09-18T14:37:00.000Z");
    const series = buildHourlySeries(
      [{ windowStart: "2026-09-18T13:00:00.000Z", count: 4 }],
      3,
      now,
    );
    expect(series).toEqual([
      {
        startMs: Date.parse("2026-09-18T12:00:00.000Z"),
        endMs: Date.parse("2026-09-18T13:00:00.000Z"),
        count: 0,
      },
      {
        startMs: Date.parse("2026-09-18T13:00:00.000Z"),
        endMs: Date.parse("2026-09-18T14:00:00.000Z"),
        count: 4,
      },
      {
        startMs: Date.parse("2026-09-18T14:00:00.000Z"),
        endMs: Date.parse("2026-09-18T15:00:00.000Z"),
        count: 0,
      },
    ]);
  });

  it("skips unparseable buckets and still fills every hour", () => {
    const now = new Date("2026-09-18T10:00:00.000Z");
    const series = buildHourlySeries(
      [
        { windowStart: "not-a-date", count: 9 },
        { windowStart: "2026-09-18T10:00:00.000Z", count: Number.NaN },
      ],
      2,
      now,
    );
    expect(series).toHaveLength(2);
    expect(series.every((p) => p.count === 0)).toBe(true);
  });

  it("clamps a bad hours value so the chart never renders an empty series", () => {
    const series = buildHourlySeries([], 0, new Date("2026-09-18T10:00:00.000Z"));
    expect(series).toHaveLength(1);
  });

  it("formats keyed Flink-style lines as form + hour → count", () => {
    expect(formatHourKey("not-a-date")).toBe("—");
    expect(formatHourKey("2026-09-18T10:00:00.000Z")).toMatch(/^\d{2}:\d{2}$/);
    const line = formatKeyedStateLine({
      formTitle: "form_A",
      windowStart: "2026-09-18T10:00:00.000Z",
      count: 250,
    });
    expect(line.startsWith("form_A + ")).toBe(true);
    expect(line.endsWith(" → 250 submissions")).toBe(true);
  });

  it("maps analytics rows onto chart buckets using submissionCount", () => {
    const now = new Date("2026-09-20T11:30:00.000Z");
    const buckets = analyticsToBuckets([
      {
        windowStart: "2026-09-20T10:00:00.000Z",
        windowEnd: "2026-09-20T11:00:00.000Z",
        submissionCount: 3,
      },
    ]);
    expect(buckets).toEqual([
      {
        windowStart: "2026-09-20T10:00:00.000Z",
        windowEnd: "2026-09-20T11:00:00.000Z",
        count: 3,
      },
    ]);
    const series = buildHourlySeries(
      [{ windowStart: "2026-09-20T10:00:00.000Z", submissionCount: 3 }],
      2,
      now,
    );
    expect(series.map((p) => p.count)).toEqual([3, 0]);
  });

  it("formats an hourly window as a local date plus start–end times", () => {
    expect(formatHourRange("not-a-date", "2026-09-20T11:00:00.000Z")).toBe("—");
    expect(formatHourRange("2026-09-20T10:00:00.000Z", "bad")).toBe("—");
    const label = formatHourRange(
      "2026-09-20T10:00:00.000Z",
      "2026-09-20T11:00:00.000Z",
    );
    expect(label).toMatch(/, \d{2}:\d{2} – \d{2}:\d{2}$/);
  });
});
