import type { Prisma, PrismaClient } from "@prisma/client";

export type PersistSubmissionInput = {
  formId: string;
  formVersionId: string;
  payload: Prisma.InputJsonValue;
  idempotencyKey: string;
};

export type PersistSubmissionResult = {
  /** False when the idempotency key was already stored. */
  stored: boolean;
  submissionId: string;
  formId: string;
  formVersionId: string;
  idempotencyKey: string;
  /** Database event time (`created_at`). */
  submittedAt: Date;
};

/**
 * Store one submission. Hourly analytics are produced by the Flink job from
 * Redis Stream events, not here — so a replayed job is a no-op insert only.
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
    const row = await tx.formSubmission.findUniqueOrThrow({
      where: { idempotencyKey: input.idempotencyKey },
      select: {
        id: true,
        formId: true,
        formVersionId: true,
        idempotencyKey: true,
        createdAt: true,
      },
    });
    return {
      stored: count > 0,
      submissionId: row.id,
      formId: row.formId,
      formVersionId: row.formVersionId,
      idempotencyKey: row.idempotencyKey,
      submittedAt: row.createdAt,
    };
  });
}
