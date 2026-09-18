const HOUR_MS = 60 * 60 * 1000;

export type HourlyBucket = { windowStart: string; count: number };

export type HourlyPoint = { startMs: number; count: number };

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
    const n = Number(bucket.count);
    counts.set(start, Number.isFinite(n) && n > 0 ? n : 0);
  }

  const end = startOfUtcHour(now);
  return Array.from({ length: width }, (_, i) => {
    const startMs = end - (width - 1 - i) * HOUR_MS;
    return { startMs, count: counts.get(startMs) ?? 0 };
  });
}

/** Local clock as HH:mm, matching Flink-style window labels like 10:00. */
export function formatHourKey(isoOrMs: string | number): string {
  const d = new Date(isoOrMs);
  if (!Number.isFinite(d.getTime())) return "—";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
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
