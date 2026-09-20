const HOUR_MS = 60 * 60 * 1000;

export type HourlyAnalyticsQuery = {
  start?: string;
  end?: string;
};

/**
 * Optional inbox timestamps win; otherwise the last `hours` window so the
 * dashboard can poll for newly closed Flink aggregates.
 */
export function resolveHourlyAnalyticsQuery(params?: {
  start?: string;
  end?: string;
  hours?: number;
  now?: Date;
}): HourlyAnalyticsQuery {
  if (params?.start || params?.end) {
    return { start: params.start, end: params.end };
  }
  const hours = params?.hours;
  const width = Number.isFinite(hours) ? Math.min(720, Math.max(1, Math.floor(hours!))) : 24;
  const now = params?.now ?? new Date();
  return {
    start: new Date(now.getTime() - width * HOUR_MS).toISOString(),
    end: now.toISOString(),
  };
}

export function hourlyChartWindow(
  query: HourlyAnalyticsQuery,
  fallbackHours = 24,
): { hours: number; now: Date } {
  const now = query.end && Number.isFinite(Date.parse(query.end)) ? new Date(query.end) : new Date();
  if (query.start && Number.isFinite(Date.parse(query.start))) {
    const hours = Math.round((now.getTime() - Date.parse(query.start)) / HOUR_MS);
    return {
      hours: Number.isFinite(hours) ? Math.min(168, Math.max(1, hours)) : fallbackHours,
      now,
    };
  }
  return { hours: fallbackHours, now };
}

export function hourlyAnalyticsPath(formId: string, params?: HourlyAnalyticsQuery): string {
  const query = new URLSearchParams();
  if (params?.start) query.set("start", params.start);
  if (params?.end) query.set("end", params.end);
  const qs = query.toString();
  return `/api/forms/${encodeURIComponent(formId)}/analytics/hourly${qs ? `?${qs}` : ""}`;
}
