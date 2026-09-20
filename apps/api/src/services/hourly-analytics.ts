import { z } from "zod";
import {
  findHourlyStats,
  findOwnedForm,
  type HourlyRange,
  type HourlyStatRow,
} from "../repositories/hourly-analytics.js";

export const formIdParamSchema = z.string().uuid();

export const hourlyAnalyticsQuerySchema = z
  .object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  })
  .superRefine((query, ctx) => {
    if (query.start && query.end && new Date(query.start) >= new Date(query.end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "start must be before end",
        path: ["start"],
      });
    }
  });

export type HourlyAnalyticsQuery = z.infer<typeof hourlyAnalyticsQuerySchema>;

export type HourlyAnalyticsResult = {
  formId: string;
  data: Array<{
    windowStart: string;
    windowEnd: string;
    submissionCount: number;
  }>;
};

export type HourlyAnalyticsDeps = {
  findOwnedForm: typeof findOwnedForm;
  findHourlyStats: typeof findHourlyStats;
};

const defaultDeps: HourlyAnalyticsDeps = {
  findOwnedForm,
  findHourlyStats,
};

function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}

export function rangeFromQuery(query: HourlyAnalyticsQuery): HourlyRange {
  return {
    start: query.start ? new Date(query.start) : undefined,
    end: query.end ? new Date(query.end) : undefined,
  };
}

export function serializeHourlyAnalytics(
  formId: string,
  rows: HourlyStatRow[],
): HourlyAnalyticsResult {
  return {
    formId,
    data: rows.map((row) => ({
      windowStart: row.windowStart.toISOString(),
      windowEnd: row.windowEnd.toISOString(),
      submissionCount: Number(row.submissionCount) || 0,
    })),
  };
}

export async function getHourlyAnalytics(
  ownerId: string,
  formId: string,
  query: HourlyAnalyticsQuery,
  deps: HourlyAnalyticsDeps = defaultDeps,
): Promise<HourlyAnalyticsResult> {
  const parsedId = formIdParamSchema.safeParse(formId);
  if (!parsedId.success) {
    throw httpError(400, "Invalid form id");
  }

  const form = await deps.findOwnedForm(parsedId.data, ownerId);
  if (!form) {
    throw httpError(404, "Form not found");
  }

  const rows = await deps.findHourlyStats(form.id, rangeFromQuery(query));
  const chronological = [...rows].sort(
    (a, b) => a.windowStart.getTime() - b.windowStart.getTime(),
  );
  return serializeHourlyAnalytics(form.id, chronological);
}
