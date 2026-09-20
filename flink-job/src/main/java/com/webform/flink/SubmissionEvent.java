package com.webform.flink;

import java.io.Serializable;
import java.time.Instant;

public class SubmissionEvent implements Serializable {
  public String submissionId;
  public String formId;
  public String formVersionId;
  public String idempotencyKey;
  public long submittedAtMillis;

  public SubmissionEvent() {}

  public SubmissionEvent(
      String submissionId,
      String formId,
      String formVersionId,
      String idempotencyKey,
      long submittedAtMillis) {
    this.submissionId = submissionId;
    this.formId = formId;
    this.formVersionId = formVersionId;
    this.idempotencyKey = idempotencyKey;
    this.submittedAtMillis = submittedAtMillis;
  }

  public Instant submittedAt() {
    return Instant.ofEpochMilli(submittedAtMillis);
  }
}
