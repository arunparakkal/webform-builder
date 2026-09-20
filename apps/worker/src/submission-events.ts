import type { Redis } from "ioredis";

export const SUBMISSION_EVENTS_STREAM = "submission-events";

export type SubmissionStreamEvent = {
  submissionId: string;
  formId: string;
  submittedAt: Date;
};

/**
 * After persist, append the analytics event. Throws so BullMQ retries.
 * Flink being down is fine: the stream keeps the event. HTTP already returned 202.
 */
export async function emitSubmissionEvent(
  redis: Redis,
  event: SubmissionStreamEvent,
): Promise<void> {
  const payload = JSON.stringify({
    submissionId: event.submissionId,
    formId: event.formId,
    submittedAt: event.submittedAt.toISOString(),
  });
  await redis.xadd(
    SUBMISSION_EVENTS_STREAM,
    "MAXLEN",
    "~",
    "2000000",
    "*",
    "data",
    payload,
  );
}
