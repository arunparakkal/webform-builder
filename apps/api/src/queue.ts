export const SUBMISSION_QUEUE_NAME = "form-submissions";

export type SubmissionJobData = {
  formId: string;
  formVersionId: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
};
