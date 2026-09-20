const HOUR_MS = 60 * 60 * 1000;

export type HourlyBucket = {
  windowStart: string;
  windowEnd?: string;
  count?: number;
  submissionCount?: number;
};

export type HourlyPoint = { startMs: number; endMs: number; count: number };

function startOfUtcHour(date: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    0,
    0,
    0,
  );
}

/**
 * API buckets are UTC hours. Fill empty hours so the chart shape is honest.
 * Labels can still be formatted in local time from the UTC start.
 */
export function buildHourlySeries(
  buckets: HourlyBucket[] | undefined,
  hours: number,
  now = new Date(),
): HourlyPoint[] {
  const width = Number.isFinite(hours) ? Math.min(720, Math.max(1, Math.floor(hours))) : 24;
  const counts = new Map<number, number>();
  for (const bucket of buckets ?? []) {
    const start = startOfUtcHour(new Date(bucket.windowStart));
    if (!Number.isFinite(start)) continue;
    const n = Number(bucket.count ?? bucket.submissionCount);
    counts.set(start, Number.isFinite(n) && n > 0 ? n : 0);
  }

  const end = startOfUtcHour(now);
  return Array.from({ length: width }, (_, i) => {
    const startMs = end - (width - 1 - i) * HOUR_MS;
    return { startMs, endMs: startMs + HOUR_MS, count: counts.get(startMs) ?? 0 };
  });
}

export function analyticsToBuckets(
  rows: Array<{ windowStart: string; windowEnd?: string; submissionCount: number }> | undefined,
): HourlyBucket[] {
  return (rows ?? []).map((row) => ({
    windowStart: row.windowStart,
    windowEnd: row.windowEnd,
    count: Number(row.submissionCount) || 0,
  }));
}

/** Local clock as HH:mm, matching Flink-style window labels like 10:00. */
export function formatHourKey(isoOrMs: string | number | Date): string {
  const d = isoOrMs instanceof Date ? isoOrMs : new Date(isoOrMs);
  if (!Number.isFinite(d.getTime())) return "—";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Date plus local start–end, e.g. "Sep 20, 10:00 – 11:00". */
export function formatHourRange(
  windowStart: string | number | Date,
  windowEnd: string | number | Date,
): string {
  const start = windowStart instanceof Date ? windowStart : new Date(windowStart);
  const end = windowEnd instanceof Date ? windowEnd : new Date(windowEnd);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return "—";
  const dateLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dateLabel}, ${formatHourKey(start)} – ${formatHourKey(end)}`;
}

export type KeyedHourRow = {
  formId?: string;
  formTitle: string;
  windowStart: string;
  count: number;
};

export function formatKeyedStateLine(row: KeyedHourRow): string {
  const n = Number.isFinite(row.count) && row.count > 0 ? row.count : 0;
  const title = row.formTitle.trim() || "Untitled form";
  return `${title} + ${formatHourKey(row.windowStart)} → ${n} submissions`;
}
