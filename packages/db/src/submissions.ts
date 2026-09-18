import type { Prisma, PrismaClient } from "@prisma/client";

export type PersistSubmissionInput = {
  formId: string;
  formVersionId: string;
  payload: Prisma.InputJsonValue;
  idempotencyKey: string;
};

export type PersistSubmissionResult = {
  /** False when the idempotency key was already stored, so nothing was counted. */
  stored: boolean;
};

/**
 * Store one submission and count it into its hourly window in a single transaction.
 *
 * The count is incremented only when the insert actually created a row, so a
 * replayed job is a no-op for both tables. Window bounds are derived from the
 * stored `created_at` in SQL, which keeps the bucket and the row in the same
 * timezone and satisfies the one-hour CHECK constraint by construction.
 */
export async function persistSubmission(
  db: PrismaClient,
  input: PersistSubmissionInput,
): Promise<PersistSubmissionResult> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.formSubmission.createMany({
      data: [input],
      skipDuplicates: true,
    });
    if (count === 0) return { stored: false };

    await tx.$executeRaw`
      INSERT INTO form_hourly_stats (form_id, window_start, window_end, submission_count)
      SELECT
        s.form_id,
        date_trunc('hour', s.created_at),
        date_trunc('hour', s.created_at) + INTERVAL '1 hour',
        1
      FROM form_submissions s
      WHERE s.idempotency_key = ${input.idempotencyKey}
      ON CONFLICT (form_id, window_start)
      DO UPDATE SET submission_count = form_hourly_stats.submission_count + 1
    `;

    return { stored: true };
  });
}
