package com.webform.flink;

import java.io.Serializable;
import java.time.Instant;

public class HourlyAggregate implements Serializable {
  public String formId;
  public Instant windowStart;
  public Instant windowEnd;
  public long submissionCount;

  public HourlyAggregate() {}

  public HourlyAggregate(String formId, Instant windowStart, Instant windowEnd, long submissionCount) {
    this.formId = formId;
    this.windowStart = windowStart;
    this.windowEnd = windowEnd;
    this.submissionCount = submissionCount;
  }
}
