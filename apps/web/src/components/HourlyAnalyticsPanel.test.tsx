import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HourlyAnalyticsPanel } from "../components/HourlyAnalyticsPanel";

describe("HourlyAnalyticsPanel", () => {
  it("shows a loading state before the first response", () => {
    const html = renderToStaticMarkup(
      <HourlyAnalyticsPanel data={null} loading error={null} />,
    );
    expect(html).toContain("Loading hourly analytics…");
    expect(html).not.toContain("No hourly aggregates yet");
  });

  it("hides the panel when the API returns no hours", () => {
    const html = renderToStaticMarkup(
      <HourlyAnalyticsPanel data={[]} loading={false} error={null} />,
    );
    expect(html).toBe("");
  });

  it("shows API errors without hiding the message", () => {
    const html = renderToStaticMarkup(
      <HourlyAnalyticsPanel data={null} loading={false} error="Form not found" />,
    );
    expect(html).toContain("Form not found");
    expect(html).toContain('role="alert"');
  });

  it("lists each hour's time range and submission count", () => {
    const html = renderToStaticMarkup(
      <HourlyAnalyticsPanel
        data={[
          {
            windowStart: "2026-09-20T10:00:00.000Z",
            windowEnd: "2026-09-20T11:00:00.000Z",
            submissionCount: 3,
          },
        ]}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("3");
    expect(html).toContain("submissions");
    expect(html).toMatch(/\d{2}:\d{2} – \d{2}:\d{2}/);
  });
});
