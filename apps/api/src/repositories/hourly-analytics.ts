import { prisma } from "@webform/db";

export type HourlyStatRow = {
  windowStart: Date;
  windowEnd: Date;
  submissionCount: bigint;
};

export type HourlyRange = {
  start?: Date;
  end?: Date;
};

export async function findOwnedForm(formId: string, ownerId: string) {
  return prisma.form.findFirst({
    where: { id: formId, ownerId },
    select: { id: true },
  });
}

/** Reads pre-aggregated Flink rows only. Does not touch form_submissions. */
export async function findHourlyStats(
  formId: string,
  range: HourlyRange,
): Promise<HourlyStatRow[]> {
  return prisma.formHourlyStat.findMany({
    where: {
      formId,
      ...(range.start || range.end
        ? {
            windowStart: {
              ...(range.start ? { gte: range.start } : {}),
              ...(range.end ? { lt: range.end } : {}),
            },
          }
        : {}),
    },
    orderBy: { windowStart: "asc" },
    select: {
      windowStart: true,
      windowEnd: true,
      submissionCount: true,
    },
  });
}
