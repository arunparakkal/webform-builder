package com.webform.flink;

import java.time.Duration;
import org.apache.flink.api.common.state.StateTtlConfig;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

/** Drops duplicate Redis emits from BullMQ retries (Phase 2). */
public class DedupByIdempotencyKey extends KeyedProcessFunction<String, SubmissionEvent, SubmissionEvent> {
  private transient ValueState<Boolean> seen;

  @Override
  public void open(Configuration parameters) {
    ValueStateDescriptor<Boolean> descriptor = new ValueStateDescriptor<>("seen", Boolean.class);
    descriptor.enableTimeToLive(
        StateTtlConfig.newBuilder(Duration.ofHours(2))
            .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite)
            .build());
    seen = getRuntimeContext().getState(descriptor);
  }

  @Override
  public void processElement(SubmissionEvent event, Context ctx, Collector<SubmissionEvent> out) throws Exception {
    // Key is idempotencyKey when present, otherwise submissionId (see job keyBy).
    if (Boolean.TRUE.equals(seen.value())) {
      return;
    }
    seen.update(true);
    out.collect(event);
  }
}
