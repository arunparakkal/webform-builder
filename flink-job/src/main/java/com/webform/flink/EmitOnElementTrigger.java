package com.webform.flink;

import org.apache.flink.streaming.api.windowing.triggers.Trigger;
import org.apache.flink.streaming.api.windowing.triggers.TriggerResult;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;

/**
 * Emit the current hourly count on every submission, then purge when the hour watermark passes.
 */
public class EmitOnElementTrigger extends Trigger<Object, TimeWindow> {
  @Override
  public TriggerResult onElement(Object element, long timestamp, TimeWindow window, TriggerContext ctx) {
    ctx.registerEventTimeTimer(window.maxTimestamp());
    return TriggerResult.FIRE;
  }

  @Override
  public TriggerResult onProcessingTime(long time, TimeWindow window, TriggerContext ctx) {
    return TriggerResult.CONTINUE;
  }

  @Override
  public TriggerResult onEventTime(long time, TimeWindow window, TriggerContext ctx) {
    return time == window.maxTimestamp() ? TriggerResult.FIRE_AND_PURGE : TriggerResult.CONTINUE;
  }

  @Override
  public void clear(TimeWindow window, TriggerContext ctx) {
    ctx.deleteEventTimeTimer(window.maxTimestamp());
  }

  @Override
  public boolean canMerge() {
    return true;
  }

  @Override
  public void onMerge(TimeWindow window, OnMergeContext ctx) {
    ctx.registerEventTimeTimer(window.maxTimestamp());
  }
}
