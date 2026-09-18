import { z } from "zod";

export const hourlyQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  hours: z.coerce.number().int().min(1).max(720).default(48),
});

export const formIdParamSchema = z.string().uuid();

const HOUR_MS = 60 * 60 * 1000;

export type HourlyRange = {
  from: Date;
  to: Date;
};

export function hourlyRangeFromQuery(query: {
  from?: string;
  to?: string;
  hours: number;
}): HourlyRange {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - query.hours * HOUR_MS);
  return { from, to };
}

export function serializeHourlyBuckets(
  rows: Array<{
    windowStart: Date;
    windowEnd: Date;
    submissionCount: bigint | number;
    updatedAt: Date;
  }>,
) {
  let total = 0;
  let lastUpdatedAt: Date | null = null;
  const buckets = rows.map((row) => {
    const raw = Number(row.submissionCount);
    const count = Number.isFinite(raw) && raw > 0 ? raw : 0;
    total += count;
    if (!lastUpdatedAt || row.updatedAt > lastUpdatedAt) lastUpdatedAt = row.updatedAt;
    return {
      windowStart: row.windowStart.toISOString(),
      windowEnd: row.windowEnd.toISOString(),
      count,
    };
  });
  return {
    buckets,
    total,
    updatedAt: lastUpdatedAt ? lastUpdatedAt.toISOString() : null,
  };
}
