import type { HourlyAnalyticsRow } from "../api/client";
import { analyticsToBuckets, formatHourRange } from "../lib/hourlySeries";
import { HourlyVolumeChart } from "./HourlyVolumeChart";

type Props = {
  data: HourlyAnalyticsRow[] | null;
  hours?: number;
  now?: Date;
  loading?: boolean;
  error?: string | null;
};

export function HourlyAnalyticsPanel({
  data,
  hours = 24,
  now,
  loading = false,
  error = null,
}: Props) {
  const rows = data ?? [];
  const buckets = analyticsToBuckets(rows);
  const hasRows = rows.length > 0;
  if (!loading && !error && !hasRows) {
    return null;
  }

  return (
    <section
      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 shadow-sm"
      aria-busy={loading}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Hourly submissions</h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Aggregates by hour. Each row is one time range and its submission count.
          </p>
        </div>
        {loading ? (
          <p className="text-[11px] text-[#94A3B8]">
            {hasRows ? "Refreshing…" : "Loading hourly analytics…"}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]"
        >
          {error}
        </p>
      ) : null}

      {hasRows ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]">
          <HourlyVolumeChart
            buckets={buckets}
            hours={hours}
            now={now}
            loading={loading}
            framed={false}
          />
          <div>
            <p className="text-[11px] font-medium text-[#64748B]">Hourly range</p>
            <ul className="mt-2 divide-y divide-[#E5E7EB] rounded-lg border border-[#E5E7EB]">
              {rows.map((row) => (
                <li
                  key={`${row.windowStart}-${row.windowEnd}`}
                  className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="text-[#0F172A]">
                    {formatHourRange(row.windowStart, row.windowEnd)}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-[#0F172A]">
                    {row.submissionCount}
                    <span className="ml-1 text-xs font-normal text-[#94A3B8]">
                      {row.submissionCount === 1 ? "submission" : "submissions"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : loading && !error ? (
        <div className="mt-4 h-28 animate-pulse rounded-lg bg-[#F1F5F9]" />
      ) : null}
    </section>
  );
}
