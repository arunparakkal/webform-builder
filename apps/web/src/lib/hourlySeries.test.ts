import { describe, expect, it } from "vitest";
import { buildHourlySeries, formatHourKey, formatKeyedStateLine } from "./hourlySeries";

describe("buildHourlySeries", () => {
  it("places a UTC bucket on the matching hour even when local time is offset", () => {
    const now = new Date("2026-09-18T14:37:00.000Z");
    const series = buildHourlySeries(
      [{ windowStart: "2026-09-18T13:00:00.000Z", count: 4 }],
      3,
      now,
    );
    expect(series).toEqual([
      { startMs: Date.parse("2026-09-18T12:00:00.000Z"), count: 0 },
      { startMs: Date.parse("2026-09-18T13:00:00.000Z"), count: 4 },
      { startMs: Date.parse("2026-09-18T14:00:00.000Z"), count: 0 },
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
});
