import { useMemo } from "react";
import type { HourlyStatsResponse } from "../api/client";
import { buildHourlySeries } from "../lib/hourlySeries";

type Props = {
  stats: HourlyStatsResponse | null;
  /** How many trailing hours to draw, including empty ones. */
  hours?: number;
  loading?: boolean;
};

function formatHour(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric" });
}

export function HourlyVolumeChart({ stats, hours = 24, loading = false }: Props) {
  const series = useMemo(
    () => buildHourlySeries(stats?.buckets, hours),
    [stats, hours],
  );
  const peak = Math.max(1, ...series.map((s) => s.count));
  const windowTotal = series.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-[#64748B]">
            Submissions per hour · last {hours}h
          </p>
          <p className="text-lg font-semibold text-[#0F172A]">
            {windowTotal} <span className="text-xs font-normal text-[#94A3B8]">in window</span>
          </p>
        </div>
        <p className="text-[11px] text-[#94A3B8]">
          {loading
            ? "Refreshing…"
            : stats?.updatedAt
              ? `updated ${new Date(stats.updatedAt).toLocaleTimeString()}`
              : "no data yet"}
        </p>
      </div>

      <div className="mt-3 flex h-24 items-end gap-[3px]">
        {series.map((point) => (
          <div
            key={point.startMs}
            className="group relative flex-1"
            style={{ height: "100%" }}
          >
            <div
              className={`absolute bottom-0 w-full rounded-t transition-[height] ${
                point.count > 0 ? "bg-[#2563EB]" : "bg-[#E5E7EB]"
              }`}
              style={{
                height: point.count > 0 ? `${(point.count / peak) * 100}%` : "2px",
              }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-[#0F172A] px-1.5 py-0.5 text-[10px] whitespace-nowrap text-white group-hover:block">
              {formatHour(point.startMs)} · {point.count}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-[#94A3B8]">
        <span>{formatHour(series[0]?.startMs ?? Date.now())}</span>
        <span>peak {peak}</span>
        <span>{formatHour(series[series.length - 1]?.startMs ?? Date.now())}</span>
      </div>
    </div>
  );
}
